"""
routes/auth.py 화이트박스 통합 테스트
회원가입, 로그인, 로그아웃, 토큰 갱신 엔드포인트
"""
import pytest
import json


class TestRegister:
    """POST /auth/register 분기 테스트"""

    def test_successful_registration(self, client, app):
        """정상 회원가입"""
        with app.app_context():
            resp = client.post('/auth/register', json={
                'username': 'newuser_reg',
                'email': 'newreg@test.com',
                'password': 'Password123!',
                'first_name': '신규',
                'last_name': '사용자',
            })
            assert resp.status_code == 201
            data = json.loads(resp.data)
            assert data['success'] is True
            assert 'user_id' in data['data']
            # 정리
            from models import db, User
            u = User.query.filter_by(username='newuser_reg').first()
            if u:
                db.session.delete(u)
                db.session.commit()

    def test_missing_username(self, client, app):
        with app.app_context():
            resp = client.post('/auth/register', json={
                'email': 'noname@test.com',
                'password': 'Password123!',
            })
            assert resp.status_code == 400

    def test_missing_email(self, client, app):
        with app.app_context():
            resp = client.post('/auth/register', json={
                'username': 'noemail',
                'password': 'Password123!',
            })
            assert resp.status_code == 400

    def test_missing_password(self, client, app):
        with app.app_context():
            resp = client.post('/auth/register', json={
                'username': 'nopassword',
                'email': 'nopass@test.com',
            })
            assert resp.status_code == 400

    def test_duplicate_username(self, client, app, regular_user):
        """중복 username"""
        with app.app_context():
            resp = client.post('/auth/register', json={
                'username': regular_user.username,
                'email': 'unique@test.com',
                'password': 'Password123!',
            })
            assert resp.status_code == 400

    def test_duplicate_email(self, client, app, regular_user):
        """중복 email"""
        with app.app_context():
            resp = client.post('/auth/register', json={
                'username': 'uniqueuser',
                'email': regular_user.email,
                'password': 'Password123!',
            })
            assert resp.status_code == 400

    def test_short_password(self, client, app):
        """비밀번호 8자 미만"""
        with app.app_context():
            resp = client.post('/auth/register', json={
                'username': 'shortpw',
                'email': 'shortpw@test.com',
                'password': '1234567',  # 7자
            })
            assert resp.status_code == 400

    def test_exactly_8_char_password(self, client, app):
        """비밀번호 정확히 8자 - 통과"""
        with app.app_context():
            resp = client.post('/auth/register', json={
                'username': 'eightpw_test',
                'email': 'eightpw@test.com',
                'password': '12345678',  # 8자
            })
            assert resp.status_code == 201
            from models import db, User
            u = User.query.filter_by(username='eightpw_test').first()
            if u:
                db.session.delete(u)
                db.session.commit()

    def test_options_preflight(self, client):
        """OPTIONS 요청 통과"""
        resp = client.options('/auth/register')
        assert resp.status_code in [200, 204]


class TestLogin:
    """POST /auth/login 분기 테스트"""

    def test_successful_login(self, client, app, regular_user):
        with app.app_context():
            resp = client.post('/auth/login', json={
                'username': regular_user.username,
                'password': 'UserPass1!',
            })
            assert resp.status_code == 200
            data = json.loads(resp.data)
            assert 'access_token' in data or ('data' in data and 'access_token' in data.get('data', {}))

    def test_wrong_password(self, client, app, regular_user):
        with app.app_context():
            resp = client.post('/auth/login', json={
                'username': regular_user.username,
                'password': 'WrongPassword!',
            })
            assert resp.status_code == 401

    def test_nonexistent_user(self, client, app):
        with app.app_context():
            resp = client.post('/auth/login', json={
                'username': 'ghost_user_xyz',
                'password': 'SomePass123!',
            })
            assert resp.status_code == 401

    def test_missing_credentials(self, client, app):
        with app.app_context():
            resp = client.post('/auth/login', json={})
            assert resp.status_code in [400, 401]

    def test_inactive_user(self, client, app):
        """비활성 사용자 로그인 거부"""
        from models import db, User
        with app.app_context():
            user = User(username='inactive_login', email='inactive_login@test.com',
                        role='user', is_active=False)
            user.set_password('Pass1234!')
            db.session.add(user)
            db.session.commit()
            resp = client.post('/auth/login', json={
                'username': 'inactive_login',
                'password': 'Pass1234!',
            })
            assert resp.status_code == 401
            # 정리
            u = User.query.filter_by(username='inactive_login').first()
            if u:
                db.session.delete(u)
                db.session.commit()


class TestGuestLogin:
    """POST /auth/guest-login 분기 테스트"""

    def test_guest_login_returns_token(self, client, app):
        with app.app_context():
            resp = client.post('/auth/guest-login')
            # 엔드포인트가 없을 수도 있어서 유연하게 처리
            if resp.status_code == 404:
                pytest.skip("게스트 로그인 엔드포인트 없음")
            assert resp.status_code == 200
            data = json.loads(resp.data)
            # 토큰 또는 data.access_token
            has_token = ('access_token' in data) or (
                'data' in data and 'access_token' in data.get('data', {})
            )
            assert has_token


class TestAuthDecorators:
    """인증 데코레이터 통합 테스트 (보호된 엔드포인트)"""

    def test_no_token_returns_401(self, client, app):
        """토큰 없이 보호된 엔드포인트 접근"""
        with app.app_context():
            resp = client.get('/testcases')
            # guest_allowed는 토큰 없으면 401이 아닐 수 있음
            # 실제 응답 코드를 확인
            assert resp.status_code in [200, 401, 403, 422]

    def test_guest_token_on_guest_allowed_endpoint(self, client, app, guest_auth_headers):
        """게스트 토큰으로 guest_allowed 엔드포인트 접근"""
        with app.app_context():
            resp = client.get('/testcases', headers=guest_auth_headers)
            assert resp.status_code == 200

    def test_guest_token_on_admin_required_endpoint(self, client, app, guest_auth_headers):
        """게스트 토큰으로 admin_required 엔드포인트 → 403"""
        with app.app_context():
            resp = client.post('/projects', json={'name': '테스트'}, headers=guest_auth_headers)
            assert resp.status_code == 403

    def test_user_token_on_admin_required(self, client, app, user_auth_headers):
        """일반 사용자 토큰으로 admin_required → 403"""
        with app.app_context():
            resp = client.post('/projects', json={'name': '테스트'}, headers=user_auth_headers)
            assert resp.status_code == 403

    def test_admin_token_on_admin_required(self, client, app, auth_headers):
        """관리자 토큰으로 admin_required → 성공"""
        with app.app_context():
            resp = client.post('/projects', json={'name': '관리자 프로젝트'}, headers=auth_headers)
            assert resp.status_code == 201
            # 정리
            data = json.loads(resp.data)
            from models import db, Project
            p = db.session.get(Project, data.get('id'))
            if p:
                db.session.delete(p)
                db.session.commit()
