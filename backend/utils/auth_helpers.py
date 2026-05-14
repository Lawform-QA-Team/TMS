"""
인증 관련 헬퍼 함수들
"""
from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from models import User, UserSession, LoginFailLog, db
from datetime import timedelta
from utils.timezone_utils import get_kst_now
from utils.auth_constants import JWT_GUEST_TOKEN_EXPIRES, GUEST_USER_INFO
from utils.logger import get_logger

logger = get_logger(__name__)

def create_user_session(user_id, refresh_token, request, login_type='password'):
    """사용자 세션 생성"""
    try:
        session = UserSession(
            user_id=user_id,
            session_token=refresh_token,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            login_type=login_type,
            expires_at=get_kst_now() + timedelta(days=7)
        )
        db.session.add(session)
        db.session.commit()
        logger.info("사용자 세션 생성 완료")
        return True
    except Exception as e:
        logger.error(f"사용자 세션 생성 실패: {e}")
        db.session.rollback()
        return False


def create_login_fail_log(username, request, login_type='password'):
    """로그인 실패 기록 저장"""
    try:
        log = LoginFailLog(
            username=username,
            login_type=login_type,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(log)
        db.session.commit()
        return True
    except Exception as e:
        logger.error(f"로그인 실패 기록 저장 실패: {e}")
        db.session.rollback()
        return False

def create_tokens(user_id, expires_minutes=None):
    """JWT 토큰 생성. expires_minutes가 None이면 앱 기본값(24시간) 사용"""
    try:
        expires = timedelta(minutes=expires_minutes) if expires_minutes else None
        access_token = create_access_token(identity=str(user_id), expires_delta=expires)
        refresh_token = create_refresh_token(identity=str(user_id))
        logger.info("JWT 토큰 생성 완료")
        return access_token, refresh_token
    except Exception as e:
        logger.error(f"JWT 토큰 생성 실패: {e}")
        raise

def create_guest_tokens():
    """게스트용 JWT 토큰 생성"""
    try:
        access_token = create_access_token(
            identity='guest',
            expires_delta=JWT_GUEST_TOKEN_EXPIRES
        )
        logger.info("게스트 토큰 생성 완료")
        return access_token
    except Exception as e:
        logger.error(f"게스트 토큰 생성 실패: {e}")
        raise

def get_guest_user_data():
    """게스트 사용자 데이터 반환"""
    return {
        **GUEST_USER_INFO,
        'created_at': get_kst_now().isoformat(),
        'updated_at': get_kst_now().isoformat(),
        'last_login': None
    }

def validate_user_credentials(username, password):
    """사용자 인증 정보 검증"""
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return None, "사용자를 찾을 수 없습니다."
    
    if not user.check_password(password):
        return None, "비밀번호가 올바르지 않습니다."
    
    if not user.is_active:
        return None, "비활성화된 계정입니다."
    
    return user, None

def update_user_last_login(user):
    """사용자 마지막 로그인 시간 업데이트"""
    try:
        user.last_login = get_kst_now()
        db.session.commit()
        logger.info(f"사용자 {user.username}의 마지막 로그인 시간 업데이트 완료")
        return True
    except Exception as e:
        logger.error(f"마지막 로그인 시간 업데이트 실패: {e}")
        db.session.rollback()
        return False

def deactivate_user_sessions(user_id):
    """사용자의 모든 활성 세션 비활성화"""
    try:
        UserSession.query.filter_by(
            user_id=user_id,
            is_active=True
        ).update({'is_active': False})
        db.session.commit()
        logger.info(f"사용자 {user_id}의 세션 비활성화 완료")
        return True
    except Exception as e:
        logger.error(f"세션 비활성화 실패: {e}")
        db.session.rollback()
        return False
