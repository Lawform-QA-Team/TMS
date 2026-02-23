from flask import Blueprint, request, jsonify
from models import db, TestCase, Project
from utils.cors import add_cors_headers
from datetime import datetime
from sqlalchemy import func, text
from utils.timezone_utils import get_kst_now

# Blueprint 생성
dashboard_extended_bp = Blueprint('dashboard_extended', __name__)


# 프로젝트별 테스트 케이스 통계 (대시보드 프로젝트 카드용)
@dashboard_extended_bp.route('/dashboard/project-stats', methods=['GET', 'OPTIONS'])
def get_project_stats():
    try:
        # 프로젝트별 result_status 카운트 (TestCase.project_id 기준, Project와 left join)
        stats = (
            db.session.query(
                TestCase.project_id,
                Project.name.label('project_name'),
                TestCase.result_status,
                func.count().label('count')
            )
            .outerjoin(Project, TestCase.project_id == Project.id)
            .group_by(TestCase.project_id, Project.name, TestCase.result_status)
            .all()
        )
        # 프로젝트별로 그룹화
        by_project = {}
        for row in stats:
            pid = row.project_id
            name = row.project_name or '(프로젝트 미지정)'
            if pid not in by_project:
                by_project[pid] = {'project_id': pid, 'project_name': name, 'status_counts': {}}
            by_project[pid]['status_counts'][row.result_status] = row.count
        # 요약 리스트 생성 (프로젝트 목록에 없어도 테스트케이스만 있는 경우 포함)
        projects = Project.query.all()
        result = []
        seen_ids = set()
        for p in projects:
            pid = p.id
            seen_ids.add(pid)
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
        # project_id가 null인 테스트 케이스 (프로젝트 미지정)
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
