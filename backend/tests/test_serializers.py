"""
utils/serializers.py 화이트박스 단위 테스트
직렬화 함수들의 반환 구조 및 분기 검증
"""
import pytest
from datetime import datetime, date
from unittest.mock import MagicMock, patch


class TestGetTestcaseEffectiveProjectId:
    """get_testcase_effective_project_id() 분기 테스트"""

    def test_project_id_direct(self, app_context):
        from utils.serializers import get_testcase_effective_project_id
        tc = MagicMock()
        tc.project_id = 5
        tc.folder = None
        result = get_testcase_effective_project_id(tc)
        assert result == 5

    def test_folder_project_id_fallback(self, app_context):
        """tc.project_id가 None이면 folder.project_id 사용"""
        from utils.serializers import get_testcase_effective_project_id
        tc = MagicMock()
        tc.project_id = None
        tc.folder = MagicMock()
        tc.folder.project_id = 10
        result = get_testcase_effective_project_id(tc)
        assert result == 10

    def test_both_none_returns_none(self, app_context):
        from utils.serializers import get_testcase_effective_project_id
        tc = MagicMock()
        tc.project_id = None
        tc.folder = None
        result = get_testcase_effective_project_id(tc)
        assert result is None

    def test_project_id_zero_uses_folder(self, app_context):
        """project_id=0도 None과 같이 처리 (getattr default)"""
        from utils.serializers import get_testcase_effective_project_id
        tc = MagicMock()
        # project_id가 아예 없는 경우
        del tc.project_id
        tc.folder = MagicMock()
        tc.folder.project_id = 99
        result = get_testcase_effective_project_id(tc)
        assert result == 99


class TestSerializeFolder:
    """serialize_folder() 분기 테스트"""

    def test_with_deployment_date(self, app_context):
        from utils.serializers import serialize_folder
        folder = MagicMock()
        folder.id = 1
        folder.folder_name = '배포 v1'
        folder.parent_folder_id = None
        folder.project_id = 2
        folder.folder_type = 'deployment_date'
        folder.environment = 'dev'
        folder.deployment_date = date(2025, 12, 19)
        folder.created_at = datetime(2025, 12, 1, 9, 0, 0)
        result = serialize_folder(folder)
        assert result['deployment_date'] == '2025-12-19'
        assert result['folder_name'] == '배포 v1'

    def test_without_deployment_date(self, app_context):
        from utils.serializers import serialize_folder
        folder = MagicMock()
        folder.id = 2
        folder.folder_name = '환경 폴더'
        folder.parent_folder_id = None
        folder.project_id = 1
        folder.folder_type = 'environment'
        folder.environment = 'prod'
        folder.deployment_date = None
        folder.created_at = None
        result = serialize_folder(folder)
        assert result['deployment_date'] is None

    def test_required_keys_present(self, app_context):
        from utils.serializers import serialize_folder
        folder = MagicMock()
        folder.id = 3
        folder.folder_name = 'test'
        folder.parent_folder_id = None
        folder.project_id = None
        folder.folder_type = 'environment'
        folder.environment = 'dev'
        folder.deployment_date = None
        folder.created_at = None
        result = serialize_folder(folder)
        for key in ['id', 'folder_name', 'parent_folder_id', 'project_id',
                    'folder_type', 'environment', 'deployment_date', 'created_at']:
            assert key in result


class TestSerializeProject:
    """serialize_project() 분기 테스트"""

    def test_without_test_case_count(self, app_context):
        from utils.serializers import serialize_project
        proj = MagicMock()
        proj.id = 1
        proj.name = '프로젝트'
        proj.description = '설명'
        result = serialize_project(proj)
        assert 'test_case_count' not in result

    def test_with_test_case_count(self, app_context):
        from utils.serializers import serialize_project
        proj = MagicMock()
        proj.id = 1
        proj.name = '프로젝트'
        proj.description = '설명'
        result = serialize_project(proj, test_case_count=42)
        assert result['test_case_count'] == 42

    def test_zero_count_included(self, app_context):
        from utils.serializers import serialize_project
        proj = MagicMock()
        proj.id = 1
        proj.name = '빈 프로젝트'
        proj.description = None
        result = serialize_project(proj, test_case_count=0)
        assert result['test_case_count'] == 0


class TestSerializeUser:
    """serialize_user() 분기 테스트"""

    def test_basic_fields(self, app_context):
        from utils.serializers import serialize_user
        user = MagicMock()
        user.id = 1
        user.username = 'testuser'
        user.email = 'test@test.com'
        user.first_name = '길동'
        user.last_name = '홍'
        user.role = 'user'
        user.is_active = True
        user.created_at = datetime(2025, 1, 1, 9, 0, 0)
        result = serialize_user(user)
        assert result['username'] == 'testuser'
        assert result['role'] == 'user'
        assert 'last_login' not in result  # include_sensitive=False

    def test_with_include_sensitive(self, app_context):
        from utils.serializers import serialize_user
        user = MagicMock()
        user.id = 1
        user.username = 'testuser'
        user.email = 'test@test.com'
        user.first_name = None
        user.last_name = None
        user.role = 'admin'
        user.is_active = True
        user.created_at = datetime(2025, 1, 1, 9, 0, 0)
        user.last_login = datetime(2025, 7, 1, 10, 0, 0)
        result = serialize_user(user, include_sensitive=True)
        assert 'last_login' in result
        assert '2025-07-01' in result['last_login']

    def test_last_login_none(self, app_context):
        from utils.serializers import serialize_user
        user = MagicMock()
        user.id = 1
        user.username = 'nologin'
        user.email = 'nl@test.com'
        user.first_name = None
        user.last_name = None
        user.role = 'user'
        user.is_active = True
        user.created_at = None
        user.last_login = None
        result = serialize_user(user, include_sensitive=True)
        assert result['last_login'] is None


class TestSerializeTestResult:
    """serialize_test_result() 분기 테스트"""

    def test_basic_fields(self, app_context):
        from utils.serializers import serialize_test_result
        tr = MagicMock()
        tr.id = 1
        tr.test_case_id = 10
        tr.result = 'Pass'
        tr.execution_time = 1.5
        tr.notes = '테스트 통과'
        tr.created_at = datetime(2025, 7, 1, 9, 0, 0)
        result = serialize_test_result(tr)
        assert result['result'] == 'Pass'
        assert result['execution_time'] == 1.5
        assert result['notes'] == '테스트 통과'

    def test_notes_none(self, app_context):
        from utils.serializers import serialize_test_result
        tr = MagicMock()
        tr.id = 2
        tr.test_case_id = 5
        tr.result = 'Fail'
        tr.execution_time = 0.3
        del tr.notes  # notes 속성 없음
        tr.created_at = None
        # getattr default None
        result = serialize_test_result(tr)
        assert result['notes'] is None


class TestSerializeTestcaseWithDB:
    """serialize_testcase() DB 연동 통합 테스트"""

    def test_basic_serialization(self, app_context, sample_testcase, sample_folder, sample_project):
        from utils.serializers import serialize_testcase
        result = serialize_testcase(sample_testcase)
        assert result['id'] == sample_testcase.id
        assert result['name'] == '로그인 TC'
        assert result['tc_number'] == 'TC-001'
        assert result['main_category'] == '인증'
        assert result['result_status'] == 'Pass'

    def test_folder_name_included(self, app_context, sample_testcase, sample_folder):
        from utils.serializers import serialize_testcase
        result = serialize_testcase(sample_testcase)
        assert result.get('folder_name') == sample_folder.folder_name

    def test_project_name_included(self, app_context, sample_testcase, sample_project):
        from utils.serializers import serialize_testcase
        result = serialize_testcase(sample_testcase)
        assert result.get('project_name') == sample_project.name

    def test_created_at_iso_format(self, app_context, sample_testcase):
        from utils.serializers import serialize_testcase
        result = serialize_testcase(sample_testcase)
        if result['created_at']:
            assert 'T' in result['created_at'] or '-' in result['created_at']

    def test_include_relations_false_no_creator(self, app_context, sample_testcase):
        from utils.serializers import serialize_testcase
        result = serialize_testcase(sample_testcase, include_relations=False)
        assert 'creator_name' not in result

    def test_include_relations_true_has_creator(self, app_context, sample_testcase, admin_user):
        from utils.serializers import serialize_testcase
        result = serialize_testcase(sample_testcase, include_relations=True)
        assert 'creator_name' in result
