from flask import Blueprint, request, jsonify
from models import db, TestCase, TestResult
from utils.logger import get_logger
from utils.auth_decorators import admin_required, guest_allowed
from utils.response_utils import api_error
from utils.timezone_utils import get_kst_now

logger = get_logger(__name__)

# Blueprint 생성
testcases_extended_bp = Blueprint('testcases_extended', __name__)


# 테스트 데이터 요약 조회 (대시보드용)
@testcases_extended_bp.route('/test', methods=['GET', 'OPTIONS'])
@guest_allowed
def get_test_data():
    try:
        total_testcases = TestCase.query.count()
        try:
            running_tests = TestResult.query.filter_by(result='running').count()
            completed_tests = TestResult.query.filter_by(result='completed').count()
            failed_tests = TestResult.query.filter_by(result='failed').count()
        except Exception:
            running_tests = completed_tests = failed_tests = 0
        test_data = {
            'total_tests': total_testcases,
            'running_tests': running_tests,
            'completed_tests': completed_tests,
            'failed_tests': failed_tests,
            'last_updated': get_kst_now().strftime('%Y-%m-%d %H:%M:%S')
        }
        return jsonify(test_data), 200
    except Exception as e:
        return api_error(str(e), 500)


# 테스트 케이스 폴더 재배치 (CLM/Litigation/Dashboard 규칙)
@testcases_extended_bp.route('/testcases/reorganize', methods=['POST', 'OPTIONS'])
@admin_required
def reorganize_testcases():
    try:
        testcases = db.session.query(TestCase.id, TestCase.name, TestCase.folder_id).all()
        moved_count = 0
        updates = []
        for tc in testcases:
            new_folder_id = None
            if 'CLM' in tc.name:
                if 'Draft' in tc.name:
                    new_folder_id = 7
                elif 'Review' in tc.name:
                    new_folder_id = 8
                elif 'Sign' in tc.name:
                    new_folder_id = 9
                elif 'Process' in tc.name:
                    new_folder_id = 10
                else:
                    new_folder_id = 7
            elif 'Litigation' in tc.name:
                if 'Draft' in tc.name:
                    new_folder_id = 11
                elif 'Schedule' in tc.name:
                    new_folder_id = 12
                else:
                    new_folder_id = 11
            elif 'Dashboard' in tc.name:
                new_folder_id = 13
            if new_folder_id and tc.folder_id != new_folder_id:
                updates.append({'id': tc.id, 'folder_id': new_folder_id})
                moved_count += 1
        if updates:
            for u in updates:
                db.session.query(TestCase).filter(TestCase.id == u['id']).update(
                    {TestCase.folder_id: u['folder_id']}, synchronize_session=False
                )
            db.session.commit()
        if moved_count > 0:
            return jsonify({'status': 'success', 'message': f'{moved_count}개의 테스트 케이스가 기능 폴더로 이동되었습니다.'}), 200
        return jsonify({'status': 'info', 'message': '이동할 테스트 케이스가 없습니다.'}), 200
    except Exception as e:
        db.session.rollback()
        return api_error(str(e), 500)
