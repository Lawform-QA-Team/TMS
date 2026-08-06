"""
models.py 화이트박스 단위 테스트
User, Folder, TestCase, Project 모델의 메서드 및 속성 테스트
"""
import pytest
from datetime import datetime


class TestUserModel:
    """User 모델 메서드 테스트"""

    def test_set_and_check_password(self, app_context):
        from models import User
        user = User(username='test_pw', email='pw@test.com')
        user.set_password('MySecret123!')
        assert user.password_hash is not None
        assert user.password_hash != 'MySecret123!'  # 해시화 확인

    def test_check_password_correct(self, app_context):
        from models import User
        user = User(username='test_pw2', email='pw2@test.com')
        user.set_password('Correct1!')
        assert user.check_password('Correct1!') is True

    def test_check_password_incorrect(self, app_context):
        from models import User
        user = User(username='test_pw3', email='pw3@test.com')
        user.set_password('Correct1!')
        assert user.check_password('Wrong!') is False

    def test_get_display_name_full(self, app_context):
        """성+이름이 모두 있으면 '성이름 (username)'"""
        from models import User
        user = User(username='jdoe', email='j@test.com', first_name='길동', last_name='홍')
        result = user.get_display_name()
        assert result == '홍길동 (jdoe)'

    def test_get_display_name_last_name_only(self, app_context):
        from models import User
        user = User(username='jdoe', email='j@test.com', last_name='홍')
        result = user.get_display_name()
        assert result == '홍 (jdoe)'

    def test_get_display_name_first_name_only(self, app_context):
        from models import User
        user = User(username='jdoe', email='j@test.com', first_name='길동')
        result = user.get_display_name()
        assert result == '길동 (jdoe)'

    def test_get_display_name_username_fallback(self, app_context):
        """이름이 없으면 username 반환"""
        from models import User
        user = User(username='jdoe', email='j@test.com')
        result = user.get_display_name()
        assert result == 'jdoe'

    def test_get_display_name_email_last_fallback(self, app_context):
        """username도 없으면 email"""
        from models import User
        user = User(email='j@test.com')
        user.username = None
        result = user.get_display_name()
        assert result == 'j@test.com'

    def test_to_dict_keys(self, app_context):
        from models import User
        user = User(
            username='dictuser', email='dict@test.com',
            first_name='딕', last_name='트', role='user', is_active=True
        )
        user.set_password('Pass1!')
        from models import db
        db.session.add(user)
        db.session.flush()
        d = user.to_dict()
        expected_keys = ['id', 'username', 'email', 'first_name', 'last_name',
                         'role', 'is_active', 'last_login', 'created_at', 'updated_at']
        for k in expected_keys:
            assert k in d, f"'{k}' 누락"
        db.session.rollback()

    def test_default_role_is_user(self, app_context):
        """SQLAlchemy default는 DB flush 후 적용됨"""
        from models import db, User
        user = User(username='roleu', email='role@test.com')
        user.set_password('Pass1!')
        db.session.add(user)
        db.session.flush()
        assert user.role == 'user'
        db.session.rollback()

    def test_default_is_active_true(self, app_context):
        """SQLAlchemy default는 DB flush 후 적용됨"""
        from models import db, User
        user = User(username='actu', email='act@test.com')
        user.set_password('Pass1!')
        db.session.add(user)
        db.session.flush()
        assert user.is_active is True
        db.session.rollback()


class TestFolderModel:
    """Folder 모델 속성 테스트"""

    def test_basic_attributes(self, app_context):
        from models import Folder
        import datetime
        folder = Folder(
            folder_name='배포 v1',
            folder_type='deployment_date',
            environment='dev',
            deployment_date=datetime.date(2025, 12, 19),
        )
        assert folder.folder_name == '배포 v1'
        assert folder.folder_type == 'deployment_date'
        assert folder.environment == 'dev'

    def test_nullable_parent_folder(self, app_context):
        from models import Folder
        folder = Folder(folder_name='루트', folder_type='environment')
        assert folder.parent_folder_id is None

    def test_deployment_date_is_date(self, app_context):
        from models import Folder
        import datetime
        folder = Folder(
            folder_name='배포',
            deployment_date=datetime.date(2025, 6, 15),
        )
        assert isinstance(folder.deployment_date, datetime.date)


class TestTestCaseModel:
    """TestCase 모델 속성 테스트"""

    def test_basic_attributes(self, app_context):
        from models import TestCase
        tc = TestCase(
            name='로그인 테스트',
            tc_number='TC-001',
            main_category='인증',
            sub_category='로그인',
            result_status='Pass',
        )
        assert tc.name == '로그인 테스트'
        assert tc.tc_number == 'TC-001'
        assert tc.main_category == '인증'
        assert tc.result_status == 'Pass'

    def test_default_result_status(self, app_context):
        """SQLAlchemy default는 DB flush 후 적용됨"""
        from models import db, TestCase
        tc = TestCase(name='기본 TC')
        db.session.add(tc)
        db.session.flush()
        assert tc.result_status == 'pending'
        db.session.rollback()

    def test_tc_number_nullable(self, app_context):
        from models import TestCase
        tc = TestCase(name='번호 없는 TC')
        assert tc.tc_number is None

    def test_environment_field(self, app_context):
        from models import TestCase
        tc = TestCase(name='환경 TC', environment='prod')
        assert tc.environment == 'prod'


class TestProjectModel:
    """Project 모델 속성 테스트"""

    def test_basic_attributes(self, app_context):
        from models import Project
        proj = Project(name='TMS 프로젝트', description='테스트 관리 시스템')
        assert proj.name == 'TMS 프로젝트'
        assert proj.description == '테스트 관리 시스템'

    def test_description_nullable(self, app_context):
        from models import Project
        proj = Project(name='이름만')
        assert proj.description is None


class TestUserModelPersistence:
    """User 모델 DB 저장/조회 테스트"""

    def test_create_and_query(self, app_context):
        from models import db, User
        user = User(username='persist_test', email='persist@test.com', role='user')
        user.set_password('Pass1234!')
        db.session.add(user)
        db.session.flush()
        found = User.query.filter_by(username='persist_test').first()
        assert found is not None
        assert found.email == 'persist@test.com'
        db.session.rollback()

    def test_unique_username_constraint(self, app_context):
        """중복 username → IntegrityError"""
        from models import db, User
        from sqlalchemy.exc import IntegrityError
        u1 = User(username='dup_user', email='dup1@test.com')
        u1.set_password('Pass1!')
        u2 = User(username='dup_user', email='dup2@test.com')
        u2.set_password('Pass2!')
        db.session.add(u1)
        db.session.flush()
        db.session.add(u2)
        with pytest.raises(IntegrityError):
            db.session.flush()
        db.session.rollback()
