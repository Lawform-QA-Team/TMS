"""
utils/auth_helpers.py 화이트박스 통합 테스트
DB 연동이 필요한 함수들 검증
"""
import pytest
from datetime import datetime


class TestValidateUserCredentials:
    """validate_user_credentials() 분기 테스트"""

    def test_valid_credentials(self, app_context, regular_user):
        from utils.auth_helpers import validate_user_credentials
        user, error = validate_user_credentials(regular_user.username, 'UserPass1!')
        assert user is not None
        assert error is None

    def test_nonexistent_user(self, app_context):
        from utils.auth_helpers import validate_user_credentials
        user, error = validate_user_credentials('ghost_xyz_9999', 'SomePass!')
        assert user is None
        assert error is not None
        assert '찾을 수 없습니다' in error

    def test_wrong_password(self, app_context, regular_user):
        from utils.auth_helpers import validate_user_credentials
        user, error = validate_user_credentials(regular_user.username, 'WrongPass!')
        assert user is None
        assert error is not None
        assert '비밀번호' in error

    def test_inactive_user(self, app_context):
        from models import db, User
        from utils.auth_helpers import validate_user_credentials
        user = User(username='inactive_vh', email='inactive_vh@test.com',
                    role='user', is_active=False)
        user.set_password('Pass1234!')
        db.session.add(user)
        db.session.commit()
        result_user, error = validate_user_credentials('inactive_vh', 'Pass1234!')
        assert result_user is None
        assert '비활성화' in error
        db.session.delete(user)
        db.session.commit()


class TestUpdateUserLastLogin:
    """update_user_last_login() 분기 테스트"""

    def test_updates_last_login(self, app_context, regular_user):
        from models import db, User
        from utils.auth_helpers import update_user_last_login
        assert regular_user.last_login is None or True  # 이전 값과 무관
        result = update_user_last_login(regular_user)
        assert result is True
        # DB에서 재조회
        user = db.session.get(User, regular_user.id)
        assert user.last_login is not None
        assert isinstance(user.last_login, datetime)


class TestGetGuestUserData:
    """get_guest_user_data() 테스트"""

    def test_returns_dict_with_required_fields(self, app_context):
        from utils.auth_helpers import get_guest_user_data
        data = get_guest_user_data()
        assert isinstance(data, dict)
        assert data['id'] == 'guest'
        assert data['role'] == 'guest'
        assert data['is_active'] is True
        assert 'created_at' in data
        assert 'updated_at' in data

    def test_last_login_is_none(self, app_context):
        from utils.auth_helpers import get_guest_user_data
        data = get_guest_user_data()
        assert data['last_login'] is None

    def test_created_at_is_string(self, app_context):
        from utils.auth_helpers import get_guest_user_data
        data = get_guest_user_data()
        assert isinstance(data['created_at'], str)


class TestCreateTokens:
    """create_tokens() 분기 테스트"""

    def test_returns_two_tokens(self, app_context, regular_user):
        from utils.auth_helpers import create_tokens
        access, refresh = create_tokens(regular_user.id)
        assert access is not None
        assert refresh is not None
        assert isinstance(access, str)
        assert isinstance(refresh, str)

    def test_custom_expiry(self, app_context, regular_user):
        from utils.auth_helpers import create_tokens
        access, refresh = create_tokens(regular_user.id, expires_minutes=60)
        assert access is not None

    def test_none_expiry_uses_default(self, app_context, regular_user):
        from utils.auth_helpers import create_tokens
        access, refresh = create_tokens(regular_user.id, expires_minutes=None)
        assert access is not None


class TestDeactivateUserSessions:
    """deactivate_user_sessions() 분기 테스트"""

    def test_deactivates_sessions(self, app_context, regular_user):
        from models import db, UserSession
        from utils.auth_helpers import deactivate_user_sessions
        from utils.timezone_utils import get_kst_now
        from datetime import timedelta
        # 활성 세션 생성
        session = UserSession(
            user_id=regular_user.id,
            session_token='test-token-12345',
            is_active=True,
            expires_at=get_kst_now() + timedelta(days=7),
        )
        db.session.add(session)
        db.session.commit()
        # 비활성화
        result = deactivate_user_sessions(regular_user.id)
        assert result is True
        # 확인
        s = db.session.get(UserSession, session.id)
        assert s.is_active is False
        # 정리
        db.session.delete(s)
        db.session.commit()

    def test_no_sessions_still_returns_true(self, app_context):
        from utils.auth_helpers import deactivate_user_sessions
        result = deactivate_user_sessions(99999999)
        assert result is True
