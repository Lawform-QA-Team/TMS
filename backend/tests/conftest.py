"""
화이트박스 테스트 공통 픽스처 설정
SQLite 인메모리 DB로 실제 Flask 앱을 구성해 통합/단위 테스트 모두 지원
"""
import os
import pytest
import sqlite3
from sqlalchemy import event
from sqlalchemy.engine import Engine

# ── 앱 import 전 환경변수 강제 설정 ──────────────────────────────
os.environ.setdefault('SECRET_KEY', 'test-secret-key-for-testing-only')
os.environ.setdefault('JWT_SECRET_KEY', 'test-jwt-secret-key-for-testing')
os.environ.setdefault('DB_TYPE', 'sqlite')

# SQLite 외래키 CASCADE 전역 활성화
@event.listens_for(Engine, 'connect')
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute('PRAGMA foreign_keys=ON')
        cursor.close()


@pytest.fixture(scope='session')
def app():
    """세션 전체에서 공유되는 Flask 앱 (SQLite 인메모리 DB)"""
    from flask import Flask
    from flask_jwt_extended import JWTManager
    from flask_cors import CORS
    from datetime import timedelta

    flask_app = Flask(__name__)
    flask_app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI='sqlite:///:memory:',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SECRET_KEY='test-secret-key-for-testing-only',
        JWT_SECRET_KEY='test-jwt-secret-key-for-testing',
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=1),
    )

    from models import db
    db.init_app(flask_app)
    JWTManager(flask_app)
    CORS(flask_app, origins=['*'])

    # OPTIONS 요청 전역 처리 (app.py의 handle_options_globally 재현)
    from utils.common_helpers import handle_options_request
    @flask_app.before_request
    def handle_options_globally():
        from flask import request
        if request.method == 'OPTIONS':
            return handle_options_request()

    # Blueprint 등록
    from routes.auth import auth_bp
    from routes.testcases import testcases_bp
    from routes.analytics import analytics_bp
    from routes.folders import folders_bp

    flask_app.register_blueprint(auth_bp, url_prefix='/auth')
    flask_app.register_blueprint(testcases_bp)
    flask_app.register_blueprint(analytics_bp)
    flask_app.register_blueprint(folders_bp)

    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.drop_all()


@pytest.fixture(scope='function')
def db_session(app):
    """각 테스트 함수마다 트랜잭션을 롤백하여 격리"""
    from models import db
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        db.session.bind = connection
        yield db.session
        db.session.remove()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope='function')
def client(app):
    """Flask 테스트 클라이언트"""
    return app.test_client()


@pytest.fixture(scope='function')
def app_context(app):
    """앱 컨텍스트 내에서 실행"""
    with app.app_context():
        yield app


# ── 공통 헬퍼 픽스처 ──────────────────────────────────────────────

@pytest.fixture(scope='function')
def admin_user(app):
    """관리자 사용자 생성"""
    import uuid
    from models import db, User, UserSession
    with app.app_context():
        suffix = uuid.uuid4().hex[:8]
        user = User(
            username=f'admin_{suffix}',
            email=f'admin_{suffix}@test.com',
            role='admin',
            is_active=True,
        )
        user.set_password('AdminPass1!')
        db.session.add(user)
        db.session.commit()
        user_id = user.id
        yield user
        # changed_by 참조 레코드 먼저 정리 (FK 제약)
        from models import TestCaseHistory
        TestCaseHistory.query.filter_by(changed_by=user_id).delete()
        UserSession.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        u = db.session.get(User, user_id)
        if u:
            db.session.delete(u)
            db.session.commit()


@pytest.fixture(scope='function')
def regular_user(app):
    """일반 사용자 생성"""
    import uuid
    from models import db, User, UserSession
    with app.app_context():
        suffix = uuid.uuid4().hex[:8]
        user = User(
            username=f'user_{suffix}',
            email=f'user_{suffix}@test.com',
            role='user',
            is_active=True,
        )
        user.set_password('UserPass1!')
        db.session.add(user)
        db.session.commit()
        user_id = user.id
        yield user
        from models import TestCaseHistory
        TestCaseHistory.query.filter_by(changed_by=user_id).delete()
        UserSession.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        u = db.session.get(User, user_id)
        if u:
            db.session.delete(u)
            db.session.commit()


@pytest.fixture(scope='function')
def admin_token(app, admin_user):
    """관리자 JWT 액세스 토큰"""
    from flask_jwt_extended import create_access_token
    with app.app_context():
        return create_access_token(identity=str(admin_user.id))


@pytest.fixture(scope='function')
def user_token(app, regular_user):
    """일반 사용자 JWT 액세스 토큰"""
    from flask_jwt_extended import create_access_token
    with app.app_context():
        return create_access_token(identity=str(regular_user.id))


@pytest.fixture(scope='function')
def guest_token(app):
    """게스트 JWT 액세스 토큰"""
    from flask_jwt_extended import create_access_token
    with app.app_context():
        return create_access_token(identity='guest')


@pytest.fixture(scope='function')
def auth_headers(admin_token):
    """관리자 인증 헤더"""
    return {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}


@pytest.fixture(scope='function')
def user_auth_headers(user_token):
    """일반 사용자 인증 헤더"""
    return {'Authorization': f'Bearer {user_token}', 'Content-Type': 'application/json'}


@pytest.fixture(scope='function')
def guest_auth_headers(guest_token):
    """게스트 인증 헤더"""
    return {'Authorization': f'Bearer {guest_token}', 'Content-Type': 'application/json'}


@pytest.fixture(scope='function')
def sample_project(app, auth_headers):
    """샘플 프로젝트 생성"""
    from models import db, Project
    with app.app_context():
        proj = Project(name='테스트 프로젝트', description='화이트박스 테스트용 프로젝트')
        db.session.add(proj)
        db.session.commit()
        proj_id = proj.id
        yield proj
        p = db.session.get(Project, proj_id)
        if p:
            db.session.delete(p)
            db.session.commit()


@pytest.fixture(scope='function')
def sample_folder(app, sample_project):
    """샘플 폴더 생성"""
    from models import db, Folder
    import datetime
    with app.app_context():
        folder = Folder(
            folder_name='배포 v1.0',
            folder_type='deployment_date',
            environment='dev',
            deployment_date=datetime.date(2025, 12, 19),
            project_id=sample_project.id,
        )
        db.session.add(folder)
        db.session.commit()
        folder_id = folder.id
        yield folder
        f = db.session.get(Folder, folder_id)
        if f:
            db.session.delete(f)
            db.session.commit()


@pytest.fixture(scope='function')
def sample_testcase(app, sample_folder, admin_user):
    """샘플 테스트케이스 생성"""
    from models import db, TestCase
    with app.app_context():
        tc = TestCase(
            name='로그인 TC',
            tc_number='TC-001',
            main_category='인증',
            sub_category='로그인',
            pre_condition='앱이 실행된 상태',
            expected_result='로그인 성공',
            result_status='Pass',
            folder_id=sample_folder.id,
            project_id=sample_folder.project_id,
            environment='dev',
            creator_id=admin_user.id,
        )
        db.session.add(tc)
        db.session.commit()
        tc_id = tc.id
        yield tc
        # TC 관련 연관 데이터 먼저 정리 (SQLite에서 FK CASCADE 없음)
        from models import TestCaseHistory
        TestCaseHistory.query.filter_by(test_case_id=tc_id).delete()
        db.session.commit()
        t = db.session.get(TestCase, tc_id)
        if t:
            db.session.delete(t)
            db.session.commit()
