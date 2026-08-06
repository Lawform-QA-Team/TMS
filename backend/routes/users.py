import secrets
import json
import pyotp
from flask import Blueprint, request, jsonify
from models import db, User, UserSession, UserSecuritySettings, LoginFailLog, UserAiConfig
from utils.auth_decorators import admin_required, user_required, owner_required, login_required
from utils.auth_constants import ROLE_EXECUTIVE, VALID_USER_ROLES
from utils.cors import add_cors_headers
from utils.timezone_utils import get_kst_now

# Blueprint 생성
users_bp = Blueprint('users', __name__)

# 사용자 관리 API
@users_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """사용자 목록 조회 (관리자 전용)"""
    try:
        # 데이터베이스에서 실제 사용자 목록 조회
        users = User.query.all()
        users_data = []
        
        for user in users:
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
            users_data.append(user_data)
        
        response = jsonify(users_data)
        return add_cors_headers(response), 200
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@users_bp.route('/users/list', methods=['GET'])
@login_required
def get_users_list():
    """사용자 목록 조회 (게스트 포함 - 담당자 선택용)"""
    try:
        # 활성 사용자만 조회 (비밀번호 등 민감한 정보 제외)
        users = User.query.filter_by(is_active=True).all()
        users_data = []
        
        for user in users:
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
            users_data.append(user_data)
        
        response = jsonify(users_data)
        return add_cors_headers(response), 200
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@users_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    """새 사용자 생성"""
    try:
        data = request.get_json()
        
        # 필수 필드 검증
        if not data.get('username') or not data.get('email'):
            response = jsonify({'error': '사용자명과 이메일은 필수입니다.'})
            return add_cors_headers(response), 400
        
        # 중복 사용자명 검증
        if User.query.filter_by(username=data['username']).first():
            response = jsonify({'error': '이미 존재하는 사용자명입니다.'})
            return add_cors_headers(response), 400
        
        # 중복 이메일 검증
        if User.query.filter_by(email=data['email']).first():
            response = jsonify({'error': '이미 존재하는 이메일입니다.'})
            return add_cors_headers(response), 400
        
        temp_password = None
        user_password = data.get('password')
        if not user_password:
            # 고정 기본 비밀번호 대신 관리자에게만 전달되는 임시 비밀번호를 발급
            temp_password = secrets.token_urlsafe(12)
            user_password = temp_password
        
        requested_role = data.get('role', 'user')
        if requested_role not in VALID_USER_ROLES:
            response = jsonify({'error': '유효하지 않은 역할입니다.'})
            return add_cors_headers(response), 400

        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role=requested_role,
            is_active=True
        )
        
        # 비밀번호 설정 (해시화됨)
        user.set_password(user_password)
        
        db.session.add(user)
        db.session.commit()
        
        response = jsonify({
            'message': '사용자가 성공적으로 생성되었습니다.',
            'user_id': user.id,
            'temporary_password': temp_password
        })
        return add_cors_headers(response), 200
        
    except Exception as e:
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@users_bp.route('/users/<int:user_id>', methods=['PUT'])
@owner_required
def update_user(user_id):
    """사용자 정보 수정"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        actor = getattr(request, 'user', None)

        if actor and actor.role == ROLE_EXECUTIVE:
            response = jsonify({'error': '임원 권한은 사용자 정보를 수정할 수 없습니다.'})
            return add_cors_headers(response), 403
        
        if 'username' in data:
            # 중복 사용자명 검증
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != user_id:
                response = jsonify({'error': '이미 존재하는 사용자명입니다.'})
                return add_cors_headers(response), 400
            user.username = data['username']
        
        if 'email' in data:
            # 중복 이메일 검증
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user_id:
                response = jsonify({'error': '이미 존재하는 이메일입니다.'})
                return add_cors_headers(response), 400
            user.email = data['email']
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        
        if 'last_name' in data:
            user.last_name = data['last_name']
        
        user.updated_at = get_kst_now()
        
        if 'password' in data:
            # admin은 현재 비밀번호 없이 변경 가능, 일반 user는 현재 비밀번호 검증 필요
            if actor and actor.role != 'admin':
                current_password = data.get('current_password')
                if not current_password:
                    response = jsonify({'error': '비밀번호 변경 시 현재 비밀번호를 입력해야 합니다.'})
                    return add_cors_headers(response), 400
                if not user.check_password(current_password):
                    response = jsonify({'error': '현재 비밀번호가 올바르지 않습니다.'})
                    return add_cors_headers(response), 400
            user.set_password(data['password'])
        
        if actor and actor.role == 'admin':
            if 'role' in data:
                if data['role'] not in VALID_USER_ROLES:
                    response = jsonify({'error': '유효하지 않은 역할입니다.'})
                    return add_cors_headers(response), 400
                user.role = data['role']
            if 'is_active' in data:
                user.is_active = data['is_active']
        
        db.session.commit()
        
        response = jsonify({'message': '사용자 정보가 성공적으로 수정되었습니다.'})
        return add_cors_headers(response), 200
        
    except Exception as e:
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """사용자 삭제"""
    try:
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        
        response = jsonify({'message': '사용자가 성공적으로 삭제되었습니다.'})
        return add_cors_headers(response), 200
        
    except Exception as e:
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@users_bp.route('/users/current', methods=['GET'])
@user_required
def get_current_user():
    """현재 로그인한 사용자 정보 조회"""
    try:
        current_user = getattr(request, 'user', None)
        if not current_user:
            response = jsonify({'error': '현재 사용자 정보를 찾을 수 없습니다.'})
            return add_cors_headers(response), 404
        
        response = jsonify({
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'first_name': current_user.first_name,
            'last_name': current_user.last_name,
            'role': current_user.role,
            'is_active': current_user.is_active,
            'created_at': current_user.created_at.isoformat() if current_user.created_at else None,
            'updated_at': current_user.updated_at.isoformat() if current_user.updated_at else None,
            'last_login': current_user.last_login.isoformat() if current_user.last_login else None
        })
        return add_cors_headers(response), 200
        
    except Exception as e:
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500

@users_bp.route('/users/security-settings', methods=['GET'])
@user_required
def get_security_settings():
    """현재 사용자 보안 설정 조회"""
    try:
        current_user = getattr(request, 'user', None)
        if not current_user:
            return add_cors_headers(jsonify({'error': '인증이 필요합니다.'})), 401

        settings = UserSecuritySettings.query.filter_by(user_id=current_user.id).first()
        allowed_ips = []
        if settings and settings.allowed_ips:
            try:
                allowed_ips = json.loads(settings.allowed_ips)
            except Exception:
                allowed_ips = []

        return add_cors_headers(jsonify({
            'session_timeout_minutes': settings.session_timeout_minutes if settings else 1440,
            'allowed_ips': allowed_ips,
            'two_factor_enabled': settings.two_factor_enabled if settings else False,
        })), 200
    except Exception as e:
        return add_cors_headers(jsonify({'error': str(e)})), 500


@users_bp.route('/users/security-settings', methods=['PUT'])
@user_required
def update_security_settings():
    """현재 사용자 보안 설정 저장 (세션 만료 시간, IP 화이트리스트)"""
    try:
        current_user = getattr(request, 'user', None)
        if not current_user:
            return add_cors_headers(jsonify({'error': '인증이 필요합니다.'})), 401

        data = request.get_json()
        settings = UserSecuritySettings.query.filter_by(user_id=current_user.id).first()
        if not settings:
            settings = UserSecuritySettings(user_id=current_user.id)
            db.session.add(settings)

        if 'session_timeout_minutes' in data:
            val = int(data['session_timeout_minutes'])
            settings.session_timeout_minutes = max(15, min(val, 43200))  # 15분 ~ 30일

        if 'allowed_ips' in data:
            ips = data['allowed_ips']
            if isinstance(ips, list):
                settings.allowed_ips = json.dumps(ips) if ips else None

        settings.updated_at = get_kst_now()
        db.session.commit()

        return add_cors_headers(jsonify({'message': '보안 설정이 저장되었습니다.'})), 200
    except Exception as e:
        db.session.rollback()
        return add_cors_headers(jsonify({'error': str(e)})), 500


@users_bp.route('/users/2fa/setup', methods=['POST'])
@user_required
def setup_2fa():
    """2FA 설정 시작 — TOTP 시크릿 생성 및 QR URI 반환"""
    try:
        current_user = getattr(request, 'user', None)
        if not current_user:
            return add_cors_headers(jsonify({'error': '인증이 필요합니다.'})), 401

        settings = UserSecuritySettings.query.filter_by(user_id=current_user.id).first()
        if not settings:
            settings = UserSecuritySettings(user_id=current_user.id)
            db.session.add(settings)

        if settings.two_factor_enabled:
            return add_cors_headers(jsonify({'error': '2FA가 이미 활성화되어 있습니다.'})), 400

        secret = pyotp.random_base32()
        settings.two_factor_secret = secret
        db.session.commit()

        totp = pyotp.TOTP(secret)
        otp_uri = totp.provisioning_uri(
            name=current_user.email or current_user.username,
            issuer_name='LTMS'
        )

        return add_cors_headers(jsonify({
            'secret': secret,
            'otp_uri': otp_uri,
        })), 200
    except Exception as e:
        db.session.rollback()
        return add_cors_headers(jsonify({'error': str(e)})), 500


@users_bp.route('/users/2fa/verify', methods=['POST'])
@user_required
def verify_2fa_setup():
    """2FA 설정 완료 — OTP 코드 검증 후 활성화"""
    try:
        current_user = getattr(request, 'user', None)
        if not current_user:
            return add_cors_headers(jsonify({'error': '인증이 필요합니다.'})), 401

        data = request.get_json()
        otp_code = str(data.get('otp_code', '')).strip()
        if not otp_code:
            return add_cors_headers(jsonify({'error': 'OTP 코드를 입력하세요.'})), 400

        settings = UserSecuritySettings.query.filter_by(user_id=current_user.id).first()
        if not settings or not settings.two_factor_secret:
            return add_cors_headers(jsonify({'error': '2FA 설정을 먼저 시작하세요.'})), 400

        totp = pyotp.TOTP(settings.two_factor_secret)
        if not totp.verify(otp_code, valid_window=1):
            return add_cors_headers(jsonify({'error': 'OTP 코드가 올바르지 않습니다.'})), 400

        settings.two_factor_enabled = True
        settings.updated_at = get_kst_now()
        db.session.commit()

        return add_cors_headers(jsonify({'message': '2FA가 활성화되었습니다.'})), 200
    except Exception as e:
        db.session.rollback()
        return add_cors_headers(jsonify({'error': str(e)})), 500


@users_bp.route('/users/2fa', methods=['DELETE'])
@user_required
def disable_2fa():
    """2FA 비활성화 — 현재 비밀번호 확인 후"""
    try:
        current_user = getattr(request, 'user', None)
        if not current_user:
            return add_cors_headers(jsonify({'error': '인증이 필요합니다.'})), 401

        data = request.get_json()
        password = data.get('password', '')
        if not current_user.check_password(password):
            return add_cors_headers(jsonify({'error': '비밀번호가 올바르지 않습니다.'})), 400

        settings = UserSecuritySettings.query.filter_by(user_id=current_user.id).first()
        if settings:
            settings.two_factor_enabled = False
            settings.two_factor_secret = None
            settings.updated_at = get_kst_now()
            db.session.commit()

        return add_cors_headers(jsonify({'message': '2FA가 비활성화되었습니다.'})), 200
    except Exception as e:
        db.session.rollback()
        return add_cors_headers(jsonify({'error': str(e)})), 500


@users_bp.route('/users/<int:user_id>/change-password', methods=['PUT'])
@owner_required
def change_password(user_id):
    """사용자 비밀번호 변경"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            response = jsonify({'error': '현재 비밀번호와 새 비밀번호는 필수입니다.'})
            return add_cors_headers(response), 400
        
        # 현재 비밀번호 검증
        if not user.check_password(data['current_password']):
            response = jsonify({'error': '현재 비밀번호가 올바르지 않습니다.'})
            return add_cors_headers(response), 400
        
        # 새 비밀번호 설정
        user.set_password(data['new_password'])
        
        db.session.commit()
        
        response = jsonify({'message': '비밀번호가 성공적으로 변경되었습니다.'})
        return add_cors_headers(response), 200

    except Exception as e:
        db.session.rollback()
        response = jsonify({'error': str(e)})
        return add_cors_headers(response), 500


@users_bp.route('/users/login-history', methods=['GET'])
@user_required
def get_login_history():
    """본인 로그인 기록 조회 (최근 100건)"""
    try:
        current_user = getattr(request, 'user', None)
        if not current_user:
            return add_cors_headers(jsonify({'error': '인증이 필요합니다.'})), 401

        sessions = (
            UserSession.query
            .filter_by(user_id=current_user.id)
            .order_by(UserSession.created_at.desc())
            .limit(100)
            .all()
        )

        data = [
            {
                'id': s.id,
                'created_at': s.created_at.isoformat() if s.created_at else None,
                'login_type': s.login_type or 'password',
                'ip_address': s.ip_address,
                'user_agent': s.user_agent
            }
            for s in sessions
        ]
        return add_cors_headers(jsonify(data)), 200
    except Exception as e:
        return add_cors_headers(jsonify({'error': str(e)})), 500


@users_bp.route('/users/login-fail-history', methods=['GET'])
@admin_required
def get_login_fail_history():
    """로그인 실패 기록 조회 (관리자 전용, 최근 200건)"""
    try:
        logs = (
            LoginFailLog.query
            .order_by(LoginFailLog.created_at.desc())
            .limit(200)
            .all()
        )

        data = [
            {
                'id': log.id,
                'created_at': log.created_at.isoformat() if log.created_at else None,
                'username': log.username,
                'login_type': log.login_type or 'password',
                'ip_address': log.ip_address,
                'user_agent': log.user_agent
            }
            for log in logs
        ]
        return add_cors_headers(jsonify(data)), 200
    except Exception as e:
        return add_cors_headers(jsonify({'error': str(e)})), 500


# ── AI API 설정 ──────────────────────────────────────────────

@users_bp.route('/users/ai-config', methods=['GET', 'OPTIONS'])
@user_required
def get_ai_config():
    if request.method == 'OPTIONS':
        from utils.common_helpers import handle_options_request
        return handle_options_request()
    user_id = getattr(request, 'current_user_id', None)
    cfg = UserAiConfig.query.filter_by(user_id=int(user_id)).first()
    if not cfg:
        return add_cors_headers(jsonify({'provider': 'openai', 'api_key': '', 'model_name': ''})), 200
    # api_key는 마스킹해서 반환
    masked = ''
    if cfg.api_key:
        masked = cfg.api_key[:8] + '...' + cfg.api_key[-4:] if len(cfg.api_key) > 12 else '****'
    return add_cors_headers(jsonify({
        'provider': cfg.provider,
        'api_key_masked': masked,
        'has_api_key': bool(cfg.api_key),
        'model_name': cfg.model_name or '',
    })), 200


@users_bp.route('/users/ai-config', methods=['PUT'])
@user_required
def update_ai_config():
    user_id = int(getattr(request, 'current_user_id', 0))
    body = request.get_json() or {}
    provider = body.get('provider', 'openai').strip()
    api_key = body.get('api_key', '').strip()
    model_name = body.get('model_name', '').strip()

    cfg = UserAiConfig.query.filter_by(user_id=user_id).first()
    if not cfg:
        cfg = UserAiConfig(user_id=user_id)
        db.session.add(cfg)

    cfg.provider = provider
    if api_key:  # 빈 문자열이면 기존 키 유지
        cfg.api_key = api_key
    cfg.model_name = model_name or None
    cfg.updated_at = get_kst_now()
    db.session.commit()

    return add_cors_headers(jsonify({'message': 'AI API 설정이 저장되었습니다.'})), 200


@users_bp.route('/users/ai-config/clear-key', methods=['POST'])
@user_required
def clear_ai_api_key():
    """API 키 삭제"""
    user_id = int(getattr(request, 'current_user_id', 0))
    cfg = UserAiConfig.query.filter_by(user_id=user_id).first()
    if cfg:
        cfg.api_key = None
        cfg.updated_at = get_kst_now()
        db.session.commit()
    return add_cors_headers(jsonify({'message': 'API 키가 삭제되었습니다.'})), 200
