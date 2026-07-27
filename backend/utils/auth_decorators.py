from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from models import db, User
from utils.auth_constants import ROLE_GUEST, ROLE_ADMIN, ROLE_EXECUTIVE, ROLE_AUTHENTICATED
from utils.logger import get_logger

logger = get_logger(__name__)


def _attach_request_auth(current_user_id, user=None):
    """요청 컨텍스트에 인증 사용자 정보를 저장"""
    request.current_user_id = current_user_id
    request.user = user


def _resolve_request_user(allow_guest=False):
    """JWT에서 현재 요청 사용자를 해석"""
    verify_jwt_in_request()
    current_user_id = get_jwt_identity()

    if current_user_id == ROLE_GUEST:
        if not allow_guest:
            return None, ROLE_GUEST
        _attach_request_auth(current_user_id, None)
        return None, ROLE_GUEST

    try:
        user = db.session.get(User, int(current_user_id))
    except (TypeError, ValueError):
        return None, None

    if not user or not user.is_active:
        return None, None

    _attach_request_auth(current_user_id, user)
    return user, user.role

def admin_required(fn):
    """관리자 권한 확인 데코레이터"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # OPTIONS 요청은 인증 없이 통과 (CORS preflight)
        if request.method == 'OPTIONS':
            return fn(*args, **kwargs)

        try:
            logger.debug(f"admin_required 데코레이터 실행 - 요청 URL: {request.url}")
            user, role = _resolve_request_user()

            if not user:
                if role == ROLE_GUEST:
                    logger.warning("게스트 사용자는 관리자 엔드포인트에 접근할 수 없습니다.")
                    return jsonify({'error': '관리자 권한이 필요합니다.'}), 403
                return jsonify({'error': '로그인이 필요합니다.'}), 401

            if role != ROLE_ADMIN:
                logger.warning(f"관리자 권한 부족: {user.role}")
                return jsonify({'error': '관리자 권한이 필요합니다.'}), 403

            logger.info(f"관리자 권한 확인 완료: {user.username} ({user.role})")
            return fn(*args, **kwargs)
        except Exception as e:
            logger.error(f"admin_required 데코레이터 오류: {str(e)}")
            logger.error(f"오류 타입: {type(e).__name__}")
            return jsonify({'error': '로그인이 필요합니다.'}), 401
    return wrapper

def user_required(fn):
    """일반 사용자 권한 확인 데코레이터 (admin, user; executive는 조회만 허용)"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # OPTIONS 요청은 인증 없이 통과 (CORS preflight)
        if request.method == 'OPTIONS':
            return fn(*args, **kwargs)
        
        try:
            logger.debug(f"user_required 데코레이터 실행 - 요청 URL: {request.url}")
            user, role = _resolve_request_user()

            if not user:
                if role == ROLE_GUEST:
                    logger.warning("게스트 사용자는 일반 사용자 엔드포인트에 접근할 수 없습니다.")
                    return jsonify({'error': '사용자 권한이 필요합니다.'}), 403
                return jsonify({'error': '로그인이 필요합니다.'}), 401

            executive_read_allowed = role == ROLE_EXECUTIVE and request.method in ['GET', 'HEAD']
            if role not in ROLE_AUTHENTICATED and not executive_read_allowed:
                logger.warning(f"사용자 권한 부족: {user.role}")
                return jsonify({'error': '사용자 권한이 필요합니다.'}), 403

            logger.info(f"사용자 권한 확인 완료: {user.username} ({user.role})")
            return fn(*args, **kwargs)
        except Exception as e:
            logger.error(f"user_required 데코레이터 오류: {str(e)}")
            logger.error(f"오류 타입: {type(e).__name__}")
            return jsonify({'error': '로그인이 필요합니다.'}), 401
    return wrapper

def guest_allowed(fn):
    """게스트 토큰을 포함한 인증 사용자를 허용하는 데코레이터"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # OPTIONS 요청은 인증 없이 통과 (CORS preflight)
        if request.method == 'OPTIONS':
            return fn(*args, **kwargs)

        try:
            user, role = _resolve_request_user(allow_guest=True)

            if role == ROLE_GUEST:
                return fn(*args, **kwargs)

            if not user:
                return jsonify({'error': '유효하지 않은 사용자입니다.'}), 401

            return fn(*args, **kwargs)
        except Exception as e:
            logger.error(f"guest_allowed 데코레이터 오류: {str(e)}")
            return jsonify({'error': '로그인이 필요합니다.'}), 401
    return wrapper

def role_required(allowed_roles):
    """특정 역할 권한 확인 데코레이터"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                user, role = _resolve_request_user(allow_guest=ROLE_GUEST in allowed_roles)

                if role == ROLE_GUEST:
                    if ROLE_GUEST not in allowed_roles:
                        return jsonify({'error': '접근 권한이 없습니다.'}), 403
                    return fn(*args, **kwargs)

                if not user:
                    return jsonify({'error': '로그인이 필요합니다.'}), 401

                if user.role not in allowed_roles:
                    return jsonify({'error': '접근 권한이 없습니다.'}), 403

                return fn(*args, **kwargs)
            except Exception:
                return jsonify({'error': '로그인이 필요합니다.'}), 401
        return wrapper
    return decorator

def login_required(fn):
    """실제 사용자 로그인 필요 데코레이터 (게스트 제외)"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            user, role = _resolve_request_user()

            if not user:
                if role == ROLE_GUEST:
                    return jsonify({'error': '사용자 로그인이 필요합니다.'}), 403
                return jsonify({'error': '로그인이 필요합니다.'}), 401

            return fn(*args, **kwargs)
        except Exception:
            return jsonify({'error': '로그인이 필요합니다.'}), 401
    return wrapper

def owner_required(fn):
    """소유자 권한 확인 데코레이터 (자신의 데이터만 수정 가능)"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            user, role = _resolve_request_user()

            if not user:
                if role == ROLE_GUEST:
                    return jsonify({'error': '소유자 권한이 필요합니다.'}), 403
                return jsonify({'error': '유효하지 않은 사용자입니다.'}), 401

            # admin은 모든 데이터에 접근 가능
            if user.role == ROLE_ADMIN:
                return fn(*args, **kwargs)

            # user는 자신의 데이터만 접근 가능
            # URL 파라미터에서 user_id나 creator_id를 확인
            request_data = request.get_json() or {}
            url_user_id = request.view_args.get('user_id')
            creator_id = request_data.get('creator_id')

            if url_user_id and int(url_user_id) != user.id:
                return jsonify({'error': '자신의 데이터만 수정할 수 있습니다.'}), 403

            if creator_id and int(creator_id) != user.id:
                return jsonify({'error': '자신의 데이터만 수정할 수 있습니다.'}), 403

            return fn(*args, **kwargs)
        except Exception:
            return jsonify({'error': '로그인이 필요합니다.'}), 401
    return wrapper

def get_user_from_token(token):
    """JWT 토큰에서 사용자 정보 추출 (SocketIO 등에서 사용)"""
    try:
        from flask_jwt_extended import decode_token
        from models import User
        
        decoded_token = decode_token(token)
        user_id = decoded_token.get('sub')

        if user_id == ROLE_GUEST:
            return None

        user = db.session.get(User, int(user_id))
        if user and user.is_active:
            return user

        return None
    except Exception as e:
        logger.error(f"토큰에서 사용자 정보 추출 오류: {str(e)}")
        return None
