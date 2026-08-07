from flask import Blueprint, request, jsonify, send_from_directory
from models import db, AutomationTest, TestExecution
from utils.cors import add_cors_headers
from utils.auth_decorators import guest_allowed, user_required, admin_required
from utils.timezone_utils import get_kst_now
from datetime import datetime
import time
import os
import glob
from pathlib import Path
from urllib.parse import unquote
import json

# Blueprint 생성
automation_bp = Blueprint('automation', __name__)

# 스크린샷 관련 설정
SCREENSHOT_BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'test-scripts')


def _serialize_automation_execution(execution):
    """자동화 실행 결과를 프런트엔드 응답 스키마로 변환"""
    summary = {}
    if execution.result_summary:
        try:
            summary = json.loads(execution.result_summary)
        except (json.JSONDecodeError, TypeError):
            summary = {}

    return {
        'id': execution.id,
        'automation_test_id': execution.automation_test_id,
        'result': summary.get('result') or execution.status,
        'execution_time': summary.get('execution_time'),
        'environment': execution.environment,
        'executed_by': execution.executed_by,
        'executed_at': (execution.completed_at or execution.started_at).isoformat() if (execution.completed_at or execution.started_at) else None,
        'notes': summary.get('notes')
    }

# 자동화 테스트 API
@automation_bp.route('/automation-tests', methods=['GET'])
@guest_allowed
def get_automation_tests():
    """모든 자동화 테스트 조회"""
    try:
        from models import User
        
        tests = AutomationTest.query.all()
        
        response_data = []
        for test in tests:
            # 작성자 정보 조회
            creator_name = None
            if test.creator_id:
                creator = db.session.get(User, test.creator_id)
                if creator:
                    creator_name = creator.get_display_name()
            
            # 담당자 정보 조회
            assignee_name = None
            if test.assignee_id:
                assignee = db.session.get(User, test.assignee_id)
                if assignee:
                    assignee_name = assignee.get_display_name()
            
            response_data.append({
                'id': test.id,
                'name': test.name,
                'description': test.description,
                'test_type': test.test_type,
                'script_path': test.script_path,
                'environment': test.environment,
                'parameters': test.parameters,
                'creator_id': test.creator_id,
                'creator_name': creator_name,
                'assignee_id': test.assignee_id,
                'assignee_name': assignee_name,
                'created_at': test.created_at.isoformat() if test.created_at else None,
                'updated_at': test.updated_at.isoformat() if test.updated_at else None
            })
        
        response = jsonify(response_data)
        return add_cors_headers(response), 200
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@automation_bp.route('/automation-tests', methods=['POST'])
@user_required
def create_automation_test():
    """자동화 테스트 생성"""
    try:
        from flask_jwt_extended import get_jwt_identity
        
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        new_test = AutomationTest(
            name=data['name'],
            description=data.get('description', ''),
            test_type=data['test_type'],
            script_path=data['script_path'],
            environment=data.get('environment', 'dev'),
            parameters=data.get('parameters', ''),
            creator_id=current_user_id,
            assignee_id=data.get('assignee_id')
        )
        
        db.session.add(new_test)
        db.session.commit()
        
        response = jsonify({
            'id': new_test.id,
            'name': new_test.name,
            'message': '자동화 테스트가 성공적으로 생성되었습니다.'
        })
        return add_cors_headers(response), 201
    except Exception as e:
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@automation_bp.route('/automation-tests/<int:id>', methods=['GET'])
@guest_allowed
def get_automation_test(id):
    """특정 자동화 테스트 조회"""
    try:
        test = AutomationTest.query.get_or_404(id)
        response = jsonify({
            'id': test.id,
            'name': test.name,
            'description': test.description,
            'test_type': test.test_type,
            'script_path': test.script_path,
            'environment': test.environment,
            'parameters': test.parameters,
            'created_at': test.created_at.isoformat() if test.created_at else None,
            'updated_at': test.updated_at.isoformat() if test.updated_at else None
        })
        return add_cors_headers(response), 200
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@automation_bp.route('/automation-tests/<int:id>', methods=['PUT'])
@user_required
def update_automation_test(id):
    """자동화 테스트 수정"""
    try:
        test = AutomationTest.query.get_or_404(id)
        data = request.get_json()
        
        test.name = data['name']
        test.description = data.get('description', '')
        test.test_type = data['test_type']
        test.script_path = data['script_path']
        test.environment = data.get('environment', 'dev')
        test.parameters = data.get('parameters', '')
        test.assignee_id = data.get('assignee_id')
        test.updated_at = get_kst_now()
        
        db.session.commit()
        
        response = jsonify({
            'message': '자동화 테스트가 성공적으로 수정되었습니다.'
        })
        return add_cors_headers(response), 200
    except Exception as e:
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@automation_bp.route('/automation-tests/<int:id>', methods=['DELETE'])
@admin_required
def delete_automation_test(id):
    """자동화 테스트 삭제"""
    try:
        test = AutomationTest.query.get_or_404(id)
        db.session.delete(test)
        db.session.commit()
        
        response = jsonify({
            'message': '자동화 테스트가 성공적으로 삭제되었습니다.'
        })
        return add_cors_headers(response), 200
    except Exception as e:
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@automation_bp.route('/automation-tests/<int:id>/execute', methods=['POST'])
@user_required
def execute_automation_test(id):
    """자동화 테스트 실행"""
    try:
        test = AutomationTest.query.get_or_404(id)
        
        # 실행 시작 시간
        execution_start = get_kst_now()
        
        # 실제로는 여기서 자동화 테스트를 실행
        # 현재는 시뮬레이션
        time.sleep(2)  # 실행 시간 시뮬레이션
        
        # 실행 종료 시간
        execution_end = get_kst_now()
        execution_duration = (execution_end - execution_start).total_seconds()
        
        # 시뮬레이션된 결과 (실제로는 테스트 실행 결과)
        status = 'Pass'  # 또는 'Fail', 'Skip', 'Error'
        output = f"테스트 '{test.name}' 실행 완료"
        error_message = None
        
        execution = TestExecution(
            automation_test_id=test.id,
            test_type='automation',
            environment=test.environment,
            executed_by=request.user.username if getattr(request, 'user', None) else 'system',
            status=status,
            result_summary=json.dumps({
                'result': status,
                'execution_time': execution_duration,
                'notes': output,
                'error_message': error_message
            }, ensure_ascii=False),
            started_at=execution_start,
            completed_at=execution_end
        )
        
        db.session.add(execution)
        db.session.commit()
        
        response = jsonify({
            'message': '자동화 테스트 실행이 완료되었습니다.',
            'test_name': test.name,
            'status': status,
            'execution_duration': execution_duration,
            'result_id': execution.id
        })
        return add_cors_headers(response), 200
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@automation_bp.route('/automation-tests/<int:id>/results', methods=['GET'])
@user_required
def get_automation_test_results(id):
    """자동화 테스트의 실행 결과 조회"""
    try:
        executions = TestExecution.query.filter_by(
            automation_test_id=id
        ).order_by(TestExecution.completed_at.desc(), TestExecution.started_at.desc()).all()
        
        response = jsonify([_serialize_automation_execution(execution) for execution in executions])
        return add_cors_headers(response), 200
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@automation_bp.route('/automation-tests/<int:id>/results/<int:result_id>', methods=['GET'])
@user_required
def get_automation_test_result_detail(id, result_id):
    """특정 자동화 테스트 실행 결과 상세 조회"""
    try:
        execution = TestExecution.query.filter_by(
            automation_test_id=id,
            id=result_id
        ).first_or_404()

        response = jsonify(_serialize_automation_execution(execution))
        return add_cors_headers(response), 200
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@automation_bp.route('/screenshots', methods=['GET'])
@user_required
def get_screenshots():
    """사용 가능한 스크린샷 목록 조회"""
    try:
        screenshots = []
        
        # test-scripts 폴더 내의 모든 PNG 파일 검색
        for root, dirs, files in os.walk(SCREENSHOT_BASE_PATH):
            for file in files:
                if file.lower().endswith('.png'):
                    # 상대 경로 계산
                    rel_path = os.path.relpath(os.path.join(root, file), SCREENSHOT_BASE_PATH)
                    screenshots.append({
                        'filename': file,
                        'path': rel_path,
                        'timestamp': os.path.getmtime(os.path.join(root, file)),
                        'size': os.path.getsize(os.path.join(root, file))
                    })
        
        # 타임스탬프 기준으로 정렬 (최신순)
        screenshots.sort(key=lambda x: x['timestamp'], reverse=True)
        
        response = jsonify(screenshots)
        return add_cors_headers(response), 200
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@automation_bp.route('/screenshots/by-test/<int:test_id>', methods=['GET'])
@user_required
def get_screenshots_by_test(test_id):
    """특정 테스트와 관련된 스크린샷 조회"""
    try:
        # 테스트 정보 조회
        test = AutomationTest.query.get_or_404(test_id)
        
        # 스크립트 경로에서 스크린샷 폴더 추정
        script_path = test.script_path
        screenshots = []
        
        # 스크립트 경로 기반으로 관련 스크린샷 검색
        if script_path:
            # 스크립트 파일명에서 폴더명 추출
            script_name = os.path.basename(script_path)
            script_dir = os.path.dirname(script_path)
            
            # 관련 스크린샷 폴더 검색
            for root, dirs, files in os.walk(SCREENSHOT_BASE_PATH):
                for file in files:
                    if file.lower().endswith('.png'):
                        # 스크립트와 관련된 스크린샷인지 확인
                        rel_path = os.path.relpath(os.path.join(root, file), SCREENSHOT_BASE_PATH)
                        
                        # 스크립트 경로와 관련된 스크린샷 필터링
                        if script_name.lower().replace('.js', '') in rel_path.lower() or \
                           any(part in rel_path.lower() for part in script_dir.lower().split('/') if part):
                            screenshots.append({
                                'filename': file,
                                'path': rel_path,
                                'timestamp': os.path.getmtime(os.path.join(root, file)),
                                'size': os.path.getsize(os.path.join(root, file))
                            })
        
        # 타임스탬프 기준으로 정렬 (최신순)
        screenshots.sort(key=lambda x: x['timestamp'], reverse=True)
        
        response = jsonify(screenshots)
        return add_cors_headers(response), 200
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@automation_bp.route('/screenshots/recent', methods=['GET'])
@user_required
def get_recent_screenshots():
    """최근 스크린샷 조회"""
    try:
        limit = request.args.get('limit', 10, type=int)
        screenshots = []
        
        # test-scripts 폴더 내의 모든 PNG 파일 검색
        for root, dirs, files in os.walk(SCREENSHOT_BASE_PATH):
            for file in files:
                if file.lower().endswith('.png'):
                    rel_path = os.path.relpath(os.path.join(root, file), SCREENSHOT_BASE_PATH)
                    screenshots.append({
                        'filename': file,
                        'path': rel_path,
                        'timestamp': os.path.getmtime(os.path.join(root, file)),
                        'size': os.path.getsize(os.path.join(root, file))
                    })
        
        # 타임스탬프 기준으로 정렬하고 최근 것만 반환
        screenshots.sort(key=lambda x: x['timestamp'], reverse=True)
        screenshots = screenshots[:limit]
        
        response = jsonify(screenshots)
        return add_cors_headers(response), 200
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500 
