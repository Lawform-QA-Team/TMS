from flask import Blueprint, request, jsonify
from models import db, TestCase, TestResult, Screenshot, Folder
from utils.cors import add_cors_headers
from utils.timezone_utils import get_kst_now
from utils.logger import get_logger
from utils.auth_decorators import user_required
from utils.response_utils import api_error
from datetime import datetime
import io
import os

logger = get_logger(__name__)

# pandas import를 조건부로 처리
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    logger.warning("pandas 모듈을 사용할 수 없습니다. Excel 기능이 비활성화됩니다.")

# Blueprint 생성
testcases_extended_bp = Blueprint('testcases_extended', __name__)

# 특정 테스트 케이스 조회, 수정, 삭제 (app.py 로직 통합)
@testcases_extended_bp.route('/testcases/<int:testcase_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def manage_testcase(testcase_id):
    try:
        testcase = TestCase.query.get_or_404(testcase_id)
        
        if request.method == 'GET':
            effective_project_id = testcase.project_id
            if effective_project_id is None and testcase.folder_id:
                folder = Folder.query.get(testcase.folder_id)
                if folder:
                    effective_project_id = folder.project_id
            data = {
                'id': testcase.id,
                'name': testcase.name,
                'description': testcase.description,
                'test_type': testcase.test_type,
                'script_path': testcase.script_path,
                'folder_id': testcase.folder_id,
                'project_id': testcase.project_id,
                'effective_project_id': effective_project_id,
                'main_category': testcase.main_category,
                'sub_category': testcase.sub_category,
                'detail_category': testcase.detail_category,
                'pre_condition': testcase.pre_condition,
                'expected_result': testcase.expected_result,
                'remark': testcase.remark,
                'automation_code_path': testcase.automation_code_path,
                'environment': testcase.environment,
                'created_at': testcase.created_at.isoformat(),
                'updated_at': testcase.updated_at.isoformat() if testcase.updated_at else None
            }
            return jsonify(data), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            testcase.name = data.get('name', testcase.name)
            testcase.description = data.get('description', testcase.description)
            testcase.test_type = data.get('test_type', testcase.test_type)
            testcase.script_path = data.get('script_path', testcase.script_path)
            new_folder_id = data.get('folder_id', testcase.folder_id)
            if new_folder_id != testcase.folder_id and new_folder_id:
                new_folder = Folder.query.get(new_folder_id)
                if new_folder and new_folder.project_id is not None:
                    testcase.project_id = new_folder.project_id
            testcase.folder_id = new_folder_id
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Test case updated successfully'}), 200
        
        elif request.method == 'DELETE':
            db.session.delete(testcase)
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Test case deleted successfully'}), 200
            
    except Exception as e:
        return api_error(str(e), 500)

# 테스트 케이스 상태 업데이트 (TestResult 사용)
@testcases_extended_bp.route('/testcases/<int:testcase_id>/status', methods=['PUT', 'OPTIONS'])
def update_testcase_status(testcase_id):
    try:
        testcase = TestCase.query.get_or_404(testcase_id)
        data = request.get_json()
        new_status = data.get('status')
        
        test_result = TestResult.query.filter_by(test_case_id=testcase_id).first()
        if not test_result:
            test_result = TestResult(test_case_id=testcase_id)
            db.session.add(test_result)
        
        test_result.result = new_status
        test_result.execution_time = data.get('execution_time', 0)
        test_result.notes = data.get('result_data', '')
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Test case status updated successfully'}), 200
    except Exception as e:
        return api_error(str(e), 500)

# 테스트 케이스 스크린샷 조회
@testcases_extended_bp.route('/testcases/<int:testcase_id>/screenshots', methods=['GET', 'OPTIONS'])
def get_testcase_screenshots(testcase_id):
    try:
        test_results = TestResult.query.filter_by(test_case_id=testcase_id).all()
        screenshots = []
        for result in test_results:
            result_screenshots = Screenshot.query.filter_by(test_result_id=result.id).all()
            for screenshot in result_screenshots:
                screenshots.append({
                    'id': screenshot.id,
                    'screenshot_path': screenshot.file_path,
                    'timestamp': screenshot.created_at.isoformat() if screenshot.created_at else None
                })
        return jsonify(screenshots), 200
    except Exception as e:
        return api_error(str(e), 500)

# Excel 파일 업로드
@testcases_extended_bp.route('/testcases/upload', methods=['POST', 'OPTIONS'])
def upload_testcases():
    # pandas 사용 불가능 시 오류 반환
    if not PANDAS_AVAILABLE:
        response = jsonify({'error': 'Excel 파일 처리를 위해 pandas 모듈이 필요합니다. 현재 환경에서는 지원되지 않습니다.'})
        return add_cors_headers(response), 501
    
    try:
        if 'file' not in request.files:
            response = jsonify({'error': '파일이 없습니다'})
            return add_cors_headers(response), 400
        
        file = request.files['file']
        if file.filename == '':
            response = jsonify({'error': '파일이 선택되지 않았습니다'})
            return add_cors_headers(response), 400
        
        if file and file.filename.endswith('.xlsx'):
            # Excel 파일 처리 로직
            df = pd.read_excel(file)

            # 업로드 시 지정한 폴더가 있으면 우선 적용
            override_folder_id = request.form.get('folder_id')
            if override_folder_id:
                override_folder_id = int(override_folder_id)

            # 데이터 검증 및 저장
            success_count = 0
            for _, row in df.iterrows():
                try:
                    testcase = TestCase(
                        name=row.get('name', ''),
                        description=row.get('description', ''),
                        project_id=row.get('project_id'),
                        folder_id=override_folder_id if override_folder_id else row.get('folder_id')
                    )
                    db.session.add(testcase)
                    success_count += 1
                except Exception as e:
                    logger.error(f"행 처리 오류: {e}")
                    continue
            
            db.session.commit()
            
            response = jsonify({
                'message': f'{success_count}개의 테스트 케이스가 성공적으로 업로드되었습니다'
            })
            return add_cors_headers(response), 200
        else:
            response = jsonify({'error': 'Excel 파일(.xlsx)만 업로드 가능합니다'})
            return add_cors_headers(response), 400
            
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

# Excel 파일 다운로드
@testcases_extended_bp.route('/testcases/download', methods=['GET', 'OPTIONS'])
def download_testcases():
    # pandas 사용 불가능 시 오류 반환
    if not PANDAS_AVAILABLE:
        response = jsonify({'error': 'Excel 파일 생성을 위해 pandas 모듈이 필요합니다. 현재 환경에서는 지원되지 않습니다.'})
        return add_cors_headers(response), 501
    
    try:
        testcases = TestCase.query.all()
        
        # DataFrame 생성
        data = []
        for tc in testcases:
            data.append({
                'id': tc.id,
                'name': tc.name,
                'description': tc.description,
                'project_id': tc.project_id,
                'folder_id': tc.folder_id,
                'created_at': tc.created_at.isoformat() if tc.created_at else None
            })
        
        df = pd.DataFrame(data)
        
        # Excel 파일 생성
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='TestCases', index=False)
        
        output.seek(0)
        
        response = jsonify({
            'message': 'Excel 파일이 생성되었습니다',
            'filename': 'testcases.xlsx',
            'data': data
        })
        return add_cors_headers(response), 200
        
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

# 테스트 케이스 실행 (TestResult 생성)
@testcases_extended_bp.route('/testcases/<int:testcase_id>/execute', methods=['POST', 'OPTIONS'])
@user_required
def execute_testcase(testcase_id):
    try:
        testcase = TestCase.query.get_or_404(testcase_id)
        test_result = TestResult(
            test_case_id=testcase_id,
            result='running',
            execution_time=0,
            notes='Test execution started'
        )
        db.session.add(test_result)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Test execution started',
            'result_id': test_result.id
        }), 200
    except Exception as e:
        return api_error(str(e), 500)

# 테스트 데이터 조회
@testcases_extended_bp.route('/test', methods=['GET', 'OPTIONS'])
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

# 테스트 실행 결과 목록 조회
@testcases_extended_bp.route('/test-executions', methods=['GET', 'OPTIONS'])
def get_test_executions():
    try:
        try:
            executions = TestResult.query.all()
        except Exception:
            return jsonify([]), 200
        data = []
        for exe in executions:
            try:
                data.append({
                    'id': exe.id,
                    'test_case_id': exe.test_case_id,
                    'status': getattr(exe, 'result', 'unknown'),
                    'execution_time': exe.execution_time,
                    'notes': exe.notes,
                    'created_at': exe.created_at.isoformat()
                })
            except Exception:
                continue
        return jsonify(data), 200
    except Exception as e:
        return api_error(str(e), 500)

# 특정 테스트 케이스 결과 조회
@testcases_extended_bp.route('/testresults/<int:testcase_id>', methods=['GET', 'OPTIONS'])
def get_test_results(testcase_id):
    try:
        results = TestResult.query.filter_by(test_case_id=testcase_id).all()
        data = [{
            'id': r.id,
            'test_case_id': r.test_case_id,
            'status': r.result,
            'execution_time': r.execution_time,
            'notes': r.notes,
            'created_at': r.created_at.isoformat()
        } for r in results]
        return jsonify(data), 200
    except Exception as e:
        return api_error(str(e), 500)

# 테스트 케이스 폴더 재배치 (CLM/Litigation/Dashboard 규칙)
@testcases_extended_bp.route('/testcases/reorganize', methods=['POST', 'OPTIONS'])
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
