"""
utils/common_helpers.py 화이트박스 단위 테스트
"""
import pytest
import json


class TestValidateRequiredFields:
    """validate_required_fields() 분기 테스트"""

    def test_all_fields_present(self, app_context):
        from utils.common_helpers import validate_required_fields
        data = {'name': 'test', 'email': 'test@test.com'}
        result = validate_required_fields(data, ['name', 'email'])
        assert result is None

    def test_missing_one_field(self, app_context):
        from utils.common_helpers import validate_required_fields
        data = {'name': 'test'}
        result = validate_required_fields(data, ['name', 'email'])
        assert result is not None
        resp, code = result
        assert code == 400
        resp_data = json.loads(resp.data)
        assert 'email' in resp_data['error']

    def test_missing_multiple_fields(self, app_context):
        from utils.common_helpers import validate_required_fields
        data = {}
        result = validate_required_fields(data, ['name', 'email', 'password'])
        assert result is not None
        resp, code = result
        assert code == 400

    def test_empty_string_treated_as_missing(self, app_context):
        """빈 문자열 필드도 누락으로 처리"""
        from utils.common_helpers import validate_required_fields
        data = {'name': '', 'email': 'test@test.com'}
        result = validate_required_fields(data, ['name', 'email'])
        assert result is not None

    def test_zero_value_treated_as_missing(self, app_context):
        """0 값도 falsy이므로 누락으로 처리됨 (현재 구현 방식)"""
        from utils.common_helpers import validate_required_fields
        data = {'count': 0, 'name': 'test'}
        result = validate_required_fields(data, ['count', 'name'])
        # 0은 falsy → 누락으로 처리 (현재 구현 확인)
        assert result is not None

    def test_empty_required_fields_list(self, app_context):
        """필수 필드 목록이 비어있으면 통과"""
        from utils.common_helpers import validate_required_fields
        data = {}
        result = validate_required_fields(data, [])
        assert result is None


class TestCreateErrorResponse:
    """create_error_response() 분기 테스트"""

    def test_default_400(self, app_context):
        from utils.common_helpers import create_error_response
        resp, code = create_error_response('테스트 오류')
        assert code == 400
        data = json.loads(resp.data)
        assert data['error'] == '테스트 오류'

    def test_custom_status_code(self, app_context):
        from utils.common_helpers import create_error_response
        resp, code = create_error_response('서버 오류', 500)
        assert code == 500

    def test_404_code(self, app_context):
        from utils.common_helpers import create_error_response
        resp, code = create_error_response('찾을 수 없음', 404)
        assert code == 404


class TestCreateSuccessResponse:
    """create_success_response() 분기 테스트"""

    def test_basic_200(self, app_context):
        from utils.common_helpers import create_success_response
        resp, code = create_success_response({'result': 'ok'})
        assert code == 200
        data = json.loads(resp.data)
        assert data == {'result': 'ok'}

    def test_custom_status_code(self, app_context):
        from utils.common_helpers import create_success_response
        resp, code = create_success_response({}, 201)
        assert code == 201


class TestGenerateRealisticTestDistribution:
    """generate_realistic_test_distribution() 분기 테스트"""

    def test_total_matches_input(self, app_context):
        from utils.common_helpers import generate_realistic_test_distribution
        total = 100
        passed, failed, nt, na, blocked = generate_realistic_test_distribution(total)
        assert passed + failed + nt + na + blocked == total

    def test_proportions_reasonable(self, app_context):
        from utils.common_helpers import generate_realistic_test_distribution
        total = 1000
        passed, failed, nt, na, blocked = generate_realistic_test_distribution(total)
        # N/T가 가장 많아야 함 (70%)
        assert nt > passed
        assert nt > failed
        assert nt > na
        assert nt > blocked

    def test_all_non_negative(self, app_context):
        from utils.common_helpers import generate_realistic_test_distribution
        for total in [0, 1, 10, 100, 1000]:
            result = generate_realistic_test_distribution(total)
            for val in result:
                assert val >= 0, f"total={total}에서 음수 값 발생"

    def test_zero_total(self, app_context):
        from utils.common_helpers import generate_realistic_test_distribution
        passed, failed, nt, na, blocked = generate_realistic_test_distribution(0)
        assert passed + failed + nt + na + blocked == 0

    def test_pass_rate_approximately_15_percent(self, app_context):
        from utils.common_helpers import generate_realistic_test_distribution
        total = 100
        passed, failed, nt, na, blocked = generate_realistic_test_distribution(total)
        assert passed == int(total * 0.15)


class TestCreateCorsResponse:
    """create_cors_response() 분기 테스트"""

    def test_default_data(self, app_context):
        from utils.common_helpers import create_cors_response
        resp, code = create_cors_response()
        assert code == 200
        data = json.loads(resp.data)
        assert data == {'status': 'preflight_ok'}

    def test_custom_data(self, app_context):
        from utils.common_helpers import create_cors_response
        resp, code = create_cors_response({'hello': 'world'})
        data = json.loads(resp.data)
        assert data == {'hello': 'world'}

    def test_custom_status_code(self, app_context):
        from utils.common_helpers import create_cors_response
        resp, code = create_cors_response(status_code=201)
        assert code == 201
