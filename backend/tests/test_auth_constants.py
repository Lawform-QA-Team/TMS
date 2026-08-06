"""
utils/auth_constants.py 화이트박스 단위 테스트
상수 값, 타입, 일관성 검증
"""
import pytest
from datetime import timedelta
from utils.auth_constants import (
    JWT_ACCESS_TOKEN_EXPIRES,
    JWT_REFRESH_TOKEN_EXPIRES,
    JWT_GUEST_TOKEN_EXPIRES,
    MIN_PASSWORD_LENGTH,
    ROLE_ADMIN,
    ROLE_EXECUTIVE,
    ROLE_USER,
    ROLE_GUEST,
    ROLE_AUTHENTICATED,
    VALID_USER_ROLES,
    GUEST_USER_INFO,
    MESSAGES,
)


class TestJwtExpiration:
    """JWT 만료 시간 상수 검증"""

    def test_access_token_is_timedelta(self):
        assert isinstance(JWT_ACCESS_TOKEN_EXPIRES, timedelta)

    def test_refresh_token_is_timedelta(self):
        assert isinstance(JWT_REFRESH_TOKEN_EXPIRES, timedelta)

    def test_guest_token_is_timedelta(self):
        assert isinstance(JWT_GUEST_TOKEN_EXPIRES, timedelta)

    def test_access_token_duration(self):
        """액세스 토큰: 24시간"""
        assert JWT_ACCESS_TOKEN_EXPIRES == timedelta(hours=24)

    def test_refresh_token_duration(self):
        """리프레시 토큰: 30일"""
        assert JWT_REFRESH_TOKEN_EXPIRES == timedelta(days=30)

    def test_guest_token_shorter_than_access(self):
        """게스트 토큰 < 액세스 토큰"""
        assert JWT_GUEST_TOKEN_EXPIRES < JWT_ACCESS_TOKEN_EXPIRES

    def test_access_shorter_than_refresh(self):
        """액세스 토큰 < 리프레시 토큰"""
        assert JWT_ACCESS_TOKEN_EXPIRES < JWT_REFRESH_TOKEN_EXPIRES


class TestPasswordPolicy:
    """비밀번호 정책 상수 검증"""

    def test_min_password_length_is_int(self):
        assert isinstance(MIN_PASSWORD_LENGTH, int)

    def test_min_password_length_value(self):
        assert MIN_PASSWORD_LENGTH == 8

    def test_min_password_length_positive(self):
        assert MIN_PASSWORD_LENGTH > 0


class TestRoles:
    """역할 상수 검증"""

    def test_role_admin_is_string(self):
        assert isinstance(ROLE_ADMIN, str)
        assert ROLE_ADMIN == 'admin'

    def test_role_executive_is_string(self):
        assert isinstance(ROLE_EXECUTIVE, str)
        assert ROLE_EXECUTIVE == 'executive'

    def test_role_user_is_string(self):
        assert isinstance(ROLE_USER, str)
        assert ROLE_USER == 'user'

    def test_role_guest_is_string(self):
        assert isinstance(ROLE_GUEST, str)
        assert ROLE_GUEST == 'guest'

    def test_role_authenticated_contains_admin_and_user(self):
        assert ROLE_ADMIN in ROLE_AUTHENTICATED
        assert ROLE_USER in ROLE_AUTHENTICATED

    def test_role_authenticated_excludes_guest(self):
        assert ROLE_GUEST not in ROLE_AUTHENTICATED

    def test_role_authenticated_excludes_executive(self):
        """executive는 별도 권한 체계"""
        assert ROLE_EXECUTIVE not in ROLE_AUTHENTICATED

    def test_valid_user_roles_contains_all(self):
        for role in [ROLE_ADMIN, ROLE_EXECUTIVE, ROLE_USER, ROLE_GUEST]:
            assert role in VALID_USER_ROLES

    def test_valid_user_roles_no_duplicates(self):
        assert len(VALID_USER_ROLES) == len(set(VALID_USER_ROLES))


class TestGuestUserInfo:
    """게스트 사용자 정보 상수 검증"""

    def test_required_fields_present(self):
        required = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active']
        for field in required:
            assert field in GUEST_USER_INFO, f"'{field}' 누락"

    def test_role_is_guest(self):
        assert GUEST_USER_INFO['role'] == ROLE_GUEST

    def test_is_active_true(self):
        assert GUEST_USER_INFO['is_active'] is True

    def test_id_is_guest_string(self):
        assert GUEST_USER_INFO['id'] == 'guest'


class TestMessages:
    """메시지 상수 검증"""

    EXPECTED_KEYS = [
        'REGISTER_SUCCESS', 'LOGIN_SUCCESS', 'LOGOUT_SUCCESS',
        'TOKEN_REFRESH_SUCCESS', 'PROFILE_UPDATE_SUCCESS', 'PASSWORD_CHANGE_SUCCESS',
        'USER_NOT_FOUND', 'INVALID_CREDENTIALS', 'ACCOUNT_INACTIVE',
        'PASSWORD_TOO_SHORT', 'USERNAME_EXISTS', 'EMAIL_EXISTS',
        'REQUIRED_FIELDS', 'CURRENT_PASSWORD_INVALID', 'NEW_PASSWORD_REQUIRED',
    ]

    def test_all_keys_present(self):
        for key in self.EXPECTED_KEYS:
            assert key in MESSAGES, f"키 '{key}' 누락"

    def test_all_values_are_strings(self):
        for key, val in MESSAGES.items():
            assert isinstance(val, str), f"'{key}'의 값이 문자열이 아님"

    def test_all_values_non_empty(self):
        for key, val in MESSAGES.items():
            assert len(val) > 0, f"'{key}'의 값이 빈 문자열"

    def test_messages_are_korean(self):
        """모든 메시지가 한국어 포함"""
        korean_chars = set('가나다라마바사아자차카타파하')
        for key, val in MESSAGES.items():
            has_korean = any(c >= '\uAC00' and c <= '\uD7A3' for c in val)
            assert has_korean, f"'{key}' 메시지에 한국어 없음: {val}"
