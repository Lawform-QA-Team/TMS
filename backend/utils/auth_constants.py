"""
인증 관련 상수들
"""
from datetime import timedelta

# JWT 설정
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
JWT_GUEST_TOKEN_EXPIRES = timedelta(hours=2)

# 비밀번호 정책
MIN_PASSWORD_LENGTH = 8

# 사용자 역할
ROLE_ADMIN = 'admin'
ROLE_EXECUTIVE = 'executive'
ROLE_USER = 'user'
ROLE_GUEST = 'guest'
ROLE_AUTHENTICATED = [ROLE_ADMIN, ROLE_USER]
VALID_USER_ROLES = [ROLE_ADMIN, ROLE_EXECUTIVE, ROLE_USER, ROLE_GUEST]

# 게스트 사용자 정보
GUEST_USER_INFO = {
    'id': 'guest',
    'username': 'guest',
    'email': 'guest@test.com',
    'first_name': '게스트',
    'last_name': '사용자',
    'role': ROLE_GUEST,
    'is_active': True
}

# 응답 메시지
MESSAGES = {
    'REGISTER_SUCCESS': '회원가입이 완료되었습니다.',
    'LOGIN_SUCCESS': '로그인이 성공했습니다.',
    'LOGOUT_SUCCESS': '로그아웃이 완료되었습니다.',
    'TOKEN_REFRESH_SUCCESS': '토큰이 성공적으로 갱신되었습니다.',
    'PROFILE_UPDATE_SUCCESS': '프로필이 수정되었습니다.',
    'PASSWORD_CHANGE_SUCCESS': '비밀번호가 변경되었습니다.',
    'USER_NOT_FOUND': '사용자를 찾을 수 없습니다.',
    'INVALID_CREDENTIALS': '사용자명 또는 비밀번호가 올바르지 않습니다.',
    'ACCOUNT_INACTIVE': '비활성화된 계정입니다.',
    'PASSWORD_TOO_SHORT': '비밀번호는 최소 8자 이상이어야 합니다.',
    'USERNAME_EXISTS': '이미 사용 중인 사용자명입니다.',
    'EMAIL_EXISTS': '이미 사용 중인 이메일입니다.',
    'REQUIRED_FIELDS': '사용자명과 비밀번호를 입력해주세요.',
    'CURRENT_PASSWORD_INVALID': '현재 비밀번호가 올바르지 않습니다.',
    'NEW_PASSWORD_REQUIRED': '현재 비밀번호와 새 비밀번호를 입력해주세요.'
}
