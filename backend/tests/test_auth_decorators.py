"""
utils/auth_decorators.py 화이트박스 통합 테스트
각 데코레이터의 접근 제어 분기 검증
"""
import pytest
import json
from flask import jsonify
from utils.auth_decorators import (
    admin_required, user_required, guest_allowed,
    login_required, role_required,
)


def make_protected_view(decorator, response_data='ok'):
    """테스트용 보호된 뷰 함수 생성"""
    @decorator
    def protected_view():
        return jsonify({'result': response_data}), 200
    protected_view.__name__ = f'view_{id(decorator)}'
    return protected_view


class TestAdminRequired:
    """admin_required 데코레이터"""

    def test_admin_can_access(self, client, app, auth_headers):
        with app.app_context():
            resp = client.post('/projects', json={'name': '관리자 접근 테스트'},
                               headers=auth_headers)
            assert resp.status_code == 201
            data = json.loads(resp.data)
            from models import db, Project
            p = db.session.get(Project, data.get('id'))
            if p:
                db.session.delete(p)
                db.session.commit()

    def test_regular_user_denied(self, client, app, user_auth_headers):
        with app.app_context():
            resp = client.post('/projects', json={'name': '유저 접근 시도'},
                               headers=user_auth_headers)
            assert resp.status_code == 403

    def test_guest_denied(self, client, app, guest_auth_headers):
        with app.app_context():
            resp = client.post('/projects', json={'name': '게스트 접근 시도'},
                               headers=guest_auth_headers)
            assert resp.status_code == 403

    def test_no_token_rejected(self, client, app):
        with app.app_context():
            resp = client.post('/projects', json={'name': '토큰 없음'})
            assert resp.status_code in [401, 403, 422]


class TestUserRequired:
    """user_required 데코레이터"""

    def test_admin_can_access_user_endpoint(self, client, app, auth_headers, sample_testcase):
        with app.app_context():
            resp = client.put(f'/testcases/{sample_testcase.id}',
                              json={'name': '관리자가 수정'},
                              headers=auth_headers)
            assert resp.status_code == 200

    def test_regular_user_can_access(self, client, app, user_auth_headers, sample_testcase):
        with app.app_context():
            resp = client.put(f'/testcases/{sample_testcase.id}',
                              json={'name': '유저가 수정'},
                              headers=user_auth_headers)
            assert resp.status_code == 200

    def test_guest_denied_on_write(self, client, app, guest_auth_headers, sample_testcase):
        with app.app_context():
            resp = client.put(f'/testcases/{sample_testcase.id}',
                              json={'name': '게스트 수정 시도'},
                              headers=guest_auth_headers)
            assert resp.status_code in [401, 403]

    def test_executive_can_read(self, client, app, sample_testcase, app_context):
        """executive 역할은 GET 허용"""
        from models import db, User
        from flask_jwt_extended import create_access_token
        with app.app_context():
            exec_user = User(username='exec_deco', email='exec_deco@test.com',
                             role='executive', is_active=True)
            exec_user.set_password('ExecPass1!')
            db.session.add(exec_user)
            db.session.commit()
            token = create_access_token(identity=str(exec_user.id))
            headers = {'Authorization': f'Bearer {token}'}
            resp = client.get(f'/testcases/{sample_testcase.id}', headers=headers)
            assert resp.status_code == 200
            db.session.delete(exec_user)
            db.session.commit()


class TestGuestAllowed:
    """guest_allowed 데코레이터"""

    def test_guest_token_allowed(self, client, app, guest_auth_headers):
        with app.app_context():
            resp = client.get('/testcases', headers=guest_auth_headers)
            assert resp.status_code == 200

    def test_regular_user_allowed(self, client, app, user_auth_headers):
        with app.app_context():
            resp = client.get('/testcases', headers=user_auth_headers)
            assert resp.status_code == 200

    def test_admin_allowed(self, client, app, auth_headers):
        with app.app_context():
            resp = client.get('/testcases', headers=auth_headers)
            assert resp.status_code == 200


class TestRoleRequired:
    """role_required 데코레이터"""

    def test_admin_in_allowed_roles(self, app_context, admin_user):
        from utils.auth_decorators import role_required
        from flask import Flask
        from flask_jwt_extended import create_access_token
        with app_context.test_request_context(
            headers={'Authorization': f'Bearer {create_access_token(str(admin_user.id))}'}
        ):
            results = []

            @role_required(['admin', 'user'])
            def test_view():
                results.append('called')
                return jsonify({}), 200

            resp = test_view()
            assert 'called' in results

    def test_guest_in_allowed_roles(self, app_context):
        from utils.auth_decorators import role_required
        from flask_jwt_extended import create_access_token
        guest_token = create_access_token(identity='guest')
        with app_context.test_request_context(
            headers={'Authorization': f'Bearer {guest_token}'}
        ):
            results = []

            @role_required(['admin', 'guest'])
            def test_view_guest():
                results.append('called')
                return jsonify({}), 200

            resp = test_view_guest()
            assert 'called' in results
