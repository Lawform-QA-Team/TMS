"""
utils/response_utils.py 화이트박스 단위 테스트
Flask 앱 컨텍스트 필요 (jsonify 사용)
"""
import pytest
import json


class TestSuccessResponse:
    """success_response() 분기 테스트"""

    def test_basic_success(self, app_context):
        from utils.response_utils import success_response
        resp, code = success_response()
        assert code == 200
        data = json.loads(resp.data)
        assert data['success'] is True

    def test_with_data(self, app_context):
        from utils.response_utils import success_response
        resp, code = success_response(data={'key': 'value'})
        data = json.loads(resp.data)
        assert data['data'] == {'key': 'value'}

    def test_without_data_no_data_key(self, app_context):
        """data=None이면 'data' 키 없음"""
        from utils.response_utils import success_response
        resp, code = success_response(data=None)
        data = json.loads(resp.data)
        assert 'data' not in data

    def test_custom_status_code(self, app_context):
        from utils.response_utils import success_response
        resp, code = success_response(status_code=201)
        assert code == 201
        data = json.loads(resp.data)
        assert data['status_code'] == 201

    def test_custom_message(self, app_context):
        from utils.response_utils import success_response
        resp, code = success_response(message='테스트 완료')
        data = json.loads(resp.data)
        assert data['message'] == '테스트 완료'


class TestErrorResponse:
    """error_response() 분기 테스트"""

    def test_basic_error(self, app_context):
        from utils.response_utils import error_response
        resp, code = error_response()
        assert code == 500
        data = json.loads(resp.data)
        assert data['success'] is False

    def test_custom_status_code(self, app_context):
        from utils.response_utils import error_response
        resp, code = error_response(status_code=400)
        assert code == 400

    def test_with_error_code(self, app_context):
        from utils.response_utils import error_response
        resp, code = error_response(error_code='VALIDATION_ERROR', status_code=400)
        data = json.loads(resp.data)
        assert data['error_code'] == 'VALIDATION_ERROR'

    def test_without_error_code_no_key(self, app_context):
        """error_code 없으면 키 없음"""
        from utils.response_utils import error_response
        resp, code = error_response(error_code=None)
        data = json.loads(resp.data)
        assert 'error_code' not in data

    def test_with_details(self, app_context):
        from utils.response_utils import error_response
        resp, code = error_response(details={'field': 'username', 'issue': 'required'})
        data = json.loads(resp.data)
        assert 'details' in data

    def test_without_details_no_key(self, app_context):
        from utils.response_utils import error_response
        resp, code = error_response(details=None)
        data = json.loads(resp.data)
        assert 'details' not in data


class TestPaginatedResponse:
    """paginated_response() 분기 테스트"""

    def test_basic_pagination(self, app_context):
        from utils.response_utils import paginated_response
        resp, code = paginated_response(data=[1, 2, 3], page=1, per_page=10, total=25)
        assert code == 200
        data = json.loads(resp.data)
        assert 'pagination' in data
        assert data['pagination']['page'] == 1
        assert data['pagination']['per_page'] == 10
        assert data['pagination']['total'] == 25

    def test_pages_calculation(self, app_context):
        """총 25개, 페이지당 10개 → 3페이지"""
        from utils.response_utils import paginated_response
        resp, code = paginated_response(data=[], page=1, per_page=10, total=25)
        data = json.loads(resp.data)
        assert data['pagination']['pages'] == 3

    def test_has_next_true(self, app_context):
        from utils.response_utils import paginated_response
        resp, code = paginated_response(data=[], page=1, per_page=10, total=25)
        data = json.loads(resp.data)
        assert data['pagination']['has_next'] is True

    def test_has_next_false_last_page(self, app_context):
        from utils.response_utils import paginated_response
        resp, code = paginated_response(data=[], page=3, per_page=10, total=25)
        data = json.loads(resp.data)
        assert data['pagination']['has_next'] is False

    def test_has_prev_false_first_page(self, app_context):
        from utils.response_utils import paginated_response
        resp, code = paginated_response(data=[], page=1, per_page=10, total=25)
        data = json.loads(resp.data)
        assert data['pagination']['has_prev'] is False

    def test_has_prev_true_second_page(self, app_context):
        from utils.response_utils import paginated_response
        resp, code = paginated_response(data=[], page=2, per_page=10, total=25)
        data = json.loads(resp.data)
        assert data['pagination']['has_prev'] is True

    def test_exact_multiple_pages(self, app_context):
        """총 10개, 페이지당 10개 → 1페이지, has_next=False"""
        from utils.response_utils import paginated_response
        resp, code = paginated_response(data=[], page=1, per_page=10, total=10)
        data = json.loads(resp.data)
        assert data['pagination']['pages'] == 1
        assert data['pagination']['has_next'] is False


class TestConvenienceResponses:
    """편의 응답 함수들 검증"""

    def test_created_response_201(self, app_context):
        from utils.response_utils import created_response
        resp, code = created_response(data={'id': 1})
        assert code == 201

    def test_not_found_response_404(self, app_context):
        from utils.response_utils import not_found_response
        resp, code = not_found_response()
        assert code == 404
        data = json.loads(resp.data)
        assert data['error_code'] == 'RESOURCE_NOT_FOUND'

    def test_validation_error_400(self, app_context):
        from utils.response_utils import validation_error_response
        resp, code = validation_error_response()
        assert code == 400
        data = json.loads(resp.data)
        assert data['error_code'] == 'VALIDATION_ERROR'

    def test_unauthorized_401(self, app_context):
        from utils.response_utils import unauthorized_response
        resp, code = unauthorized_response()
        assert code == 401
        data = json.loads(resp.data)
        assert data['error_code'] == 'UNAUTHORIZED'

    def test_forbidden_403(self, app_context):
        from utils.response_utils import forbidden_response
        resp, code = forbidden_response()
        assert code == 403
        data = json.loads(resp.data)
        assert data['error_code'] == 'FORBIDDEN'

    def test_api_error_format(self, app_context):
        """api_error는 기존 {'error': message} 형식"""
        from utils.response_utils import api_error
        resp, code = api_error('DB 오류', 500)
        assert code == 500
        data = json.loads(resp.data)
        assert data == {'error': 'DB 오류'}

    def test_deleted_response(self, app_context):
        from utils.response_utils import deleted_response
        resp, code = deleted_response()
        assert code == 200
        data = json.loads(resp.data)
        assert data['success'] is True
