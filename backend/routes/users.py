import secrets
from flask import Blueprint, request, jsonify
from models import db, User
from utils.auth_decorators import admin_required, user_required, owner_required, login_required
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
        
        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role=data.get('role', 'user'),
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
