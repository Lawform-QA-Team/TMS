from flask import Blueprint, request, jsonify
from models import db, TestCase, Project, Folder
from utils.cors import add_cors_headers
from utils.auth_decorators import guest_allowed
from datetime import datetime
from sqlalchemy import func, text
from sqlalchemy.sql import case
from utils.timezone_utils import get_kst_now

# Blueprint 생성
dashboard_extended_bp = Blueprint('dashboard_extended', __name__)


# 프로젝트별 테스트 케이스 통계 (대시보드 프로젝트 카드용)
# 테스트케이스의 project_id 우선, 없으면 연결 폴더의 project_id로 프로젝트 연결
@dashboard_extended_bp.route('/dashboard/project-stats', methods=['GET', 'OPTIONS'])
@guest_allowed
def get_project_stats():
    try:
        # 유효 프로젝트 ID = COALESCE(TestCase.project_id, Folder.project_id)
        effective_project_id = case(
            (TestCase.project_id.isnot(None), TestCase.project_id),
            else_=Folder.project_id
        )
        stats = (
            db.session.query(
                effective_project_id.label('project_id'),
                TestCase.result_status,
                func.count().label('count')
            )
            .outerjoin(Folder, TestCase.folder_id == Folder.id)
            .group_by(effective_project_id, TestCase.result_status)
            .all()
        )
        by_project = {}
        for row in stats:
            pid = row.project_id
            if pid not in by_project:
                by_project[pid] = {'status_counts': {}}
            by_project[pid]['status_counts'][row.result_status] = row.count
        projects = Project.query.all()
        result = []
        for p in projects:
            pid = p.id
            counts = by_project.get(pid, {}).get('status_counts', {}) or {}
            total = sum(counts.values())
            passed = counts.get('Pass', 0)
            failed = counts.get('Fail', 0)
            nt = counts.get('N/T', 0)
            na = counts.get('N/A', 0)
            blocked = counts.get('Block', 0)
            pass_rate = (passed / total * 100) if total > 0 else 0
            result.append({
                'project_id': pid,
                'project_name': p.name,
                'total_testcases': total,
                'passed': passed,
                'failed': failed,
                'nt': nt,
                'na': na,
                'blocked': blocked,
                'pass_rate': round(pass_rate, 2)
            })
        # 프로젝트 미지정 (TC.project_id도 폴더.project_id도 null인 경우)
        if None in by_project:
            counts = by_project[None]['status_counts']
            total = sum(counts.values())
            passed = counts.get('Pass', 0)
            failed = counts.get('Fail', 0)
            nt = counts.get('N/T', 0)
            na = counts.get('N/A', 0)
            blocked = counts.get('Block', 0)
            pass_rate = (passed / total * 100) if total > 0 else 0
            result.append({
                'project_id': None,
                'project_name': '(프로젝트 미지정)',
                'total_testcases': total,
                'passed': passed,
                'failed': failed,
                'nt': nt,
                'na': na,
                'blocked': blocked,
                'pass_rate': round(pass_rate, 2)
            })
        return add_cors_headers(jsonify(result)), 200
    except Exception as e:
        return add_cors_headers(jsonify({'error': str(e)})), 500

# 대시보드 요약 목록 조회 (프론트엔드에서 사용)
@dashboard_extended_bp.route('/dashboard-summaries', methods=['GET', 'OPTIONS'])
@guest_allowed
def get_dashboard_summaries():
    try:
        # DashboardSummary 테이블이 있으면 사용, 없으면 실시간 계산
        try:
            from models import DashboardSummary
            summaries = DashboardSummary.query.all()
            data = [{
                'id': s.id,
                'environment': s.environment,
                'total_tests': s.total_tests,
                'passed_tests': s.passed_tests,
                'failed_tests': s.failed_tests,
                'skipped_tests': s.skipped_tests,
                'pass_rate': s.pass_rate,
                'last_updated': s.last_updated.isoformat() if s.last_updated else None
            } for s in summaries]
        except:
            # DashboardSummary 테이블이 없으면 실시간 계산
            data = []
        
        response = jsonify(data)
        return add_cors_headers(response), 200
        
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

# 테스트 케이스 전체 요약 (프론트엔드에서 사용) - 실제 DB 값 사용
@dashboard_extended_bp.route('/testcases/summary/all', methods=['GET', 'OPTIONS'])
@guest_allowed
def get_testcases_summary_all():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'preflight_ok'}), 200
    
    try:
        # 실제 DB에 저장된 값으로 환경별/테스트 결과별 카운트 계산
        stats = (
            db.session.query(
                TestCase.environment,
                TestCase.result_status,
                func.count().label('count')
            )
            .group_by(TestCase.environment, TestCase.result_status)
            .order_by(TestCase.environment, TestCase.result_status)
            .all()
        )
        
        # 환경별로 데이터 그룹화
        env_stats = {}
        for row in stats:
            env = row.environment
            if env not in env_stats:
                env_stats[env] = {}
            env_stats[env][row.result_status] = row.count
        
        # 요약 데이터 생성
        summaries = []
        for environment, status_counts in env_stats.items():
            total = sum(status_counts.values())
            passed = status_counts.get('Pass', 0)
            failed = status_counts.get('Fail', 0)
            nt = status_counts.get('N/T', 0)
            na = status_counts.get('N/A', 0)
            blocked = status_counts.get('Block', 0)
            
            # 통과율 계산
            pass_rate = (passed / total * 100) if total > 0 else 0
            
            summary = {
                'environment': environment,
                'total_testcases': total,
                'passed': passed,
                'failed': failed,
                'nt': nt,
                'na': na,
                'blocked': blocked,
                'pass_rate': round(pass_rate, 2),
                'last_updated': get_kst_now().isoformat()
            }
            summaries.append(summary)
        
        response = jsonify(summaries)
        return add_cors_headers(response), 200
        
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500
