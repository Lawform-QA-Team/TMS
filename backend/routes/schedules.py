"""
테스트 스케줄 관리 API
"""
from flask import Blueprint, request, jsonify
from models import db, TestSchedule, TestCase, TestResult, User
from utils.cors import add_cors_headers
from utils.auth_decorators import admin_required, user_required, guest_allowed
from utils.timezone_utils import get_kst_now
from utils.logger import get_logger
from services.scheduler_service import scheduler_service
import json

logger = get_logger(__name__)

schedules_bp = Blueprint('schedules', __name__)

def execute_scheduled_test(schedule_id, test_case_id, environment, execution_parameters):
    """
    스케줄된 테스트 실행 콜백 함수
    
    Args:
        schedule_id: 스케줄 ID
        test_case_id: 테스트 케이스 ID
        environment: 실행 환경
        execution_parameters: 실행 파라미터
    """
    try:
        from flask import current_app
        
        with current_app.app_context():
            # 스케줄 정보 업데이트
            schedule = db.session.get(TestSchedule, schedule_id)
            if not schedule:
                logger.error(f"스케줄을 찾을 수 없습니다: {schedule_id}")
                return
            
            schedule.last_run_at = get_kst_now()
            schedule.last_run_status = 'running'
            
            # 테스트 실행
            try:
                test_case = db.session.get(TestCase, test_case_id)
                if not test_case:
                    logger.error(f"테스트 케이스를 찾을 수 없습니다: {test_case_id}")
                    schedule.last_run_status = 'failed'
                    db.session.commit()
                    return

                # Celery 태스크를 동기 방식으로 실행 (broker 없이도 동작)
                from tasks import execute_test_case
                task_result = execute_test_case.apply(
                    args=[test_case_id, environment, execution_parameters]
                )
                result = task_result.get()

                schedule.last_run_status = 'success' if result.get('result') == 'Pass' else 'failed'
                schedule.last_run_result_id = result.get('result_id')

            except Exception as exec_error:
                logger.error(f"테스트 실행 중 오류: {str(exec_error)}")
                schedule.last_run_status = 'failed'

            # 다음 실행 시간 계산
            next_run = scheduler_service.get_next_run_time(
                schedule.schedule_type,
                schedule.schedule_expression
            )
            if next_run:
                schedule.next_run_at = next_run

            db.session.commit()
            logger.info(f"스케줄된 테스트 실행 완료: 스케줄 ID {schedule_id}, 테스트 케이스 ID {test_case_id}")
                
    except Exception as e:
        logger.error(f"스케줄 실행 콜백 오류: {str(e)}")

@schedules_bp.route('/schedules', methods=['GET', 'OPTIONS'])
@guest_allowed
def get_schedules():
    """스케줄 목록 조회"""
    try:
        # 필터링 파라미터
        test_case_id = request.args.get('test_case_id', type=int)
        enabled = request.args.get('enabled', type=bool)
        active = request.args.get('active', type=bool)
        
        query = TestSchedule.query
        
        if test_case_id:
            query = query.filter(TestSchedule.test_case_id == test_case_id)
        if enabled is not None:
            query = query.filter(TestSchedule.enabled == enabled)
        if active is not None:
            query = query.filter(TestSchedule.active == active)
        
        schedules = query.order_by(TestSchedule.created_at.desc()).all()
        
        data = [schedule.to_dict() for schedule in schedules]
        
        response = jsonify(data)
        return add_cors_headers(response), 200
        
    except Exception as e:
        logger.error(f"스케줄 목록 조회 오류: {str(e)}")
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@schedules_bp.route('/schedules/<int:id>', methods=['GET', 'OPTIONS'])
@guest_allowed
def get_schedule(id):
    """스케줄 상세 조회"""
    try:
        schedule = TestSchedule.query.get_or_404(id)
        data = schedule.to_dict()
        
        response = jsonify(data)
        return add_cors_headers(response), 200
        
    except Exception as e:
        logger.error(f"스케줄 조회 오류: {str(e)}")
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@schedules_bp.route('/schedules', methods=['POST', 'OPTIONS'])
@user_required
def create_schedule():
    """스케줄 생성"""
    try:
        data = request.get_json()
        
        # 필수 필드 검증
        if not data.get('test_case_id'):
            response = jsonify({'error': 'test_case_id는 필수입니다'})
            return add_cors_headers(response), 400
        
        if not data.get('schedule_type'):
            response = jsonify({'error': 'schedule_type은 필수입니다'})
            return add_cors_headers(response), 400
        
        test_case_id = data.get('test_case_id')
        test_case = db.session.get(TestCase, test_case_id)
        if not test_case:
            response = jsonify({'error': '테스트 케이스를 찾을 수 없습니다'})
            return add_cors_headers(response), 404
        
        # 스케줄 생성
        schedule = TestSchedule(
            test_case_id=test_case_id,
            name=data.get('name', f'{test_case.name} 자동 실행'),
            description=data.get('description', ''),
            schedule_type=data.get('schedule_type'),
            schedule_expression=data.get('schedule_expression', ''),
            enabled=data.get('enabled', True),
            active=data.get('active', True),
            environment=data.get('environment', 'dev'),
            execution_parameters=json.dumps(data.get('execution_parameters', {})) if data.get('execution_parameters') else None,
            created_by=request.user.id
        )
        
        # 다음 실행 시간 계산
        next_run = scheduler_service.get_next_run_time(
            schedule.schedule_type,
            schedule.schedule_expression
        )
        if next_run:
            schedule.next_run_at = next_run
        
        db.session.add(schedule)
        db.session.commit()
        
        # 스케줄러에 작업 추가
        execution_params = json.loads(schedule.execution_parameters) if schedule.execution_parameters else None
        scheduler_service.add_schedule(
            schedule.id,
            schedule.test_case_id,
            schedule.schedule_type,
            schedule.schedule_expression,
            schedule.environment,
            execution_params,
            execute_scheduled_test
        )
        
        response = jsonify({
            'message': '스케줄이 성공적으로 생성되었습니다',
            'id': schedule.id,
            'schedule': schedule.to_dict()
        })
        return add_cors_headers(response), 201
        
    except Exception as e:
        logger.error(f"스케줄 생성 오류: {str(e)}")
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@schedules_bp.route('/schedules/<int:id>', methods=['PUT', 'OPTIONS'])
@user_required
def update_schedule(id):
    """스케줄 수정"""
    try:
        schedule = TestSchedule.query.get_or_404(id)
        data = request.get_json()
        
        # 수정 가능한 필드 업데이트
        if 'name' in data:
            schedule.name = data['name']
        if 'description' in data:
            schedule.description = data['description']
        if 'schedule_type' in data:
            schedule.schedule_type = data['schedule_type']
        if 'schedule_expression' in data:
            schedule.schedule_expression = data['schedule_expression']
        if 'enabled' in data:
            schedule.enabled = data['enabled']
        if 'active' in data:
            schedule.active = data['active']
        if 'environment' in data:
            schedule.environment = data['environment']
        if 'execution_parameters' in data:
            schedule.execution_parameters = json.dumps(data['execution_parameters']) if data['execution_parameters'] else None
        
        # 다음 실행 시간 재계산
        next_run = scheduler_service.get_next_run_time(
            schedule.schedule_type,
            schedule.schedule_expression
        )
        if next_run:
            schedule.next_run_at = next_run
        
        db.session.commit()
        
        # 스케줄러 업데이트
        if schedule.enabled and schedule.active:
            execution_params = json.loads(schedule.execution_parameters) if schedule.execution_parameters else None
            scheduler_service.add_schedule(
                schedule.id,
                schedule.test_case_id,
                schedule.schedule_type,
                schedule.schedule_expression,
                schedule.environment,
                execution_params,
                execute_scheduled_test
            )
        else:
            scheduler_service.pause_schedule(schedule.id)
        
        response = jsonify({
            'message': '스케줄이 성공적으로 수정되었습니다',
            'schedule': schedule.to_dict()
        })
        return add_cors_headers(response), 200
        
    except Exception as e:
        logger.error(f"스케줄 수정 오류: {str(e)}")
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@schedules_bp.route('/schedules/<int:id>', methods=['DELETE', 'OPTIONS'])
@user_required
def delete_schedule(id):
    """스케줄 삭제"""
    try:
        schedule = TestSchedule.query.get_or_404(id)
        
        # 스케줄러에서 제거
        scheduler_service.remove_schedule(schedule.id)
        
        # DB에서 삭제
        db.session.delete(schedule)
        db.session.commit()
        
        response = jsonify({'message': '스케줄이 성공적으로 삭제되었습니다'})
        return add_cors_headers(response), 200
        
    except Exception as e:
        logger.error(f"스케줄 삭제 오류: {str(e)}")
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@schedules_bp.route('/schedules/<int:id>/toggle', methods=['POST', 'OPTIONS'])
@user_required
def toggle_schedule(id):
    """스케줄 활성화/비활성화 토글"""
    try:
        schedule = TestSchedule.query.get_or_404(id)
        schedule.enabled = not schedule.enabled
        
        if schedule.enabled:
            # 스케줄 재개
            execution_params = json.loads(schedule.execution_parameters) if schedule.execution_parameters else None
            scheduler_service.add_schedule(
                schedule.id,
                schedule.test_case_id,
                schedule.schedule_type,
                schedule.schedule_expression,
                schedule.environment,
                execution_params,
                execute_scheduled_test
            )
        else:
            # 스케줄 일시 중지
            scheduler_service.pause_schedule(schedule.id)
        
        db.session.commit()
        
        response = jsonify({
            'message': f'스케줄이 {"활성화" if schedule.enabled else "비활성화"}되었습니다',
            'schedule': schedule.to_dict()
        })
        return add_cors_headers(response), 200
        
    except Exception as e:
        logger.error(f"스케줄 토글 오류: {str(e)}")
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@schedules_bp.route('/schedules/<int:id>/run-now', methods=['POST', 'OPTIONS'])
@user_required
def run_schedule_now(id):
    """스케줄 즉시 실행"""
    try:
        schedule = TestSchedule.query.get_or_404(id)
        
        # 즉시 실행
        execution_params = json.loads(schedule.execution_parameters) if schedule.execution_parameters else None
        execute_scheduled_test(
            schedule.id,
            schedule.test_case_id,
            schedule.environment,
            execution_params
        )
        
        response = jsonify({'message': '스케줄이 즉시 실행되었습니다'})
        return add_cors_headers(response), 200
        
    except Exception as e:
        logger.error(f"스케줄 즉시 실행 오류: {str(e)}")
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

