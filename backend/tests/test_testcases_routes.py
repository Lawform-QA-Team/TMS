"""
routes/testcases.py 화이트박스 통합 테스트
프로젝트, 폴더, TC CRUD 엔드포인트 분기 테스트
"""
import pytest
import json


# ── 프로젝트 API ────────────────────────────────────────────────

class TestProjectsCRUD:
    """프로젝트 CRUD 엔드포인트"""

    def test_get_projects_guest(self, client, app, guest_auth_headers):
        with app.app_context():
            resp = client.get('/projects', headers=guest_auth_headers)
            assert resp.status_code == 200
            assert isinstance(json.loads(resp.data), list)

    def test_create_project_admin(self, client, app, auth_headers):
        with app.app_context():
            resp = client.post('/projects', json={'name': 'CRUD 테스트 프로젝트'},
                               headers=auth_headers)
            assert resp.status_code == 201
            data = json.loads(resp.data)
            assert 'id' in data
            # 정리
            from models import db, Project
            p = db.session.get(Project, data['id'])
            if p:
                db.session.delete(p)
                db.session.commit()

    def test_create_project_no_auth(self, client, app):
        with app.app_context():
            resp = client.post('/projects', json={'name': '인증 없는 프로젝트'})
            assert resp.status_code in [401, 403, 422]

    def test_update_project(self, client, app, auth_headers, sample_project):
        with app.app_context():
            resp = client.put(f'/projects/{sample_project.id}',
                              json={'name': '수정된 이름'},
                              headers=auth_headers)
            assert resp.status_code == 200
            data = json.loads(resp.data)
            assert data['project']['name'] == '수정된 이름'

    def test_update_nonexistent_project(self, client, app, auth_headers):
        with app.app_context():
            resp = client.put('/projects/99999999',
                              json={'name': '없는 프로젝트'},
                              headers=auth_headers)
            assert resp.status_code == 404

    def test_delete_project(self, client, app, auth_headers):
        with app.app_context():
            from models import db, Project
            proj = Project(name='삭제용 프로젝트')
            db.session.add(proj)
            db.session.commit()
            resp = client.delete(f'/projects/{proj.id}', headers=auth_headers)
            assert resp.status_code == 200


# ── 테스트케이스 API ──────────────────────────────────────────────

class TestTestcasesRead:
    """GET 테스트케이스 엔드포인트"""

    def test_get_all_testcases(self, client, app, guest_auth_headers):
        with app.app_context():
            resp = client.get('/testcases', headers=guest_auth_headers)
            assert resp.status_code == 200

    def test_get_testcase_by_id(self, client, app, guest_auth_headers, sample_testcase):
        with app.app_context():
            resp = client.get(f'/testcases/{sample_testcase.id}',
                              headers=guest_auth_headers)
            assert resp.status_code == 200
            data = json.loads(resp.data)
            assert data['id'] == sample_testcase.id
            assert data['name'] == '로그인 TC'

    def test_get_nonexistent_testcase(self, client, app, guest_auth_headers):
        with app.app_context():
            resp = client.get('/testcases/99999999', headers=guest_auth_headers)
            assert resp.status_code == 404

    def test_get_testcases_with_pagination(self, client, app, guest_auth_headers):
        with app.app_context():
            resp = client.get('/testcases?page=1&per_page=5', headers=guest_auth_headers)
            assert resp.status_code == 200
            data = json.loads(resp.data)
            # 페이지네이션 시 items/pagination 키 포함
            if isinstance(data, dict):
                assert 'items' in data or isinstance(data, list)


class TestTestcasesCreate:
    """POST /testcases 엔드포인트"""

    def test_create_testcase_success(self, client, app, auth_headers, sample_folder, admin_user):
        with app.app_context():
            resp = client.post('/testcases', json={
                'name': '신규 TC',
                'tc_number': 'TC-NEW-001',
                'main_category': '테스트',
                'sub_category': '신규',
                'folder_id': sample_folder.id,
                'environment': 'dev',
                'result_status': 'N/T',
            }, headers=auth_headers)
            assert resp.status_code == 201
            data = json.loads(resp.data)
            tc_id = data.get('id')
            assert tc_id is not None
            # 정리 (history 먼저 삭제 - SQLite FK CASCADE 없음)
            from models import db, TestCase, TestCaseHistory
            TestCaseHistory.query.filter_by(test_case_id=tc_id).delete()
            db.session.commit()
            tc = db.session.get(TestCase, tc_id)
            if tc:
                db.session.delete(tc)
                db.session.commit()

    def test_create_testcase_no_name(self, client, app, auth_headers):
        with app.app_context():
            resp = client.post('/testcases', json={
                'main_category': '테스트',
            }, headers=auth_headers)
            # name이 없으면 DB 제약 위반
            assert resp.status_code in [400, 500]

    def test_create_testcase_with_tc_number(self, client, app, auth_headers, sample_folder):
        with app.app_context():
            resp = client.post('/testcases', json={
                'name': 'TC Number 테스트',
                'tc_number': 'TC-NUMBER-001',
                'folder_id': sample_folder.id,
            }, headers=auth_headers)
            assert resp.status_code == 201
            data = json.loads(resp.data)
            tc_id = data.get('id')
            from models import db, TestCase
            tc = db.session.get(TestCase, tc_id)
            if tc:
                assert tc.tc_number == 'TC-NUMBER-001'
                from models import TestCaseHistory
                TestCaseHistory.query.filter_by(test_case_id=tc_id).delete()
                db.session.commit()
                db.session.delete(tc)
                db.session.commit()


class TestTestcasesUpdate:
    """PUT /testcases/<id> 엔드포인트"""

    def test_update_testcase(self, client, app, auth_headers, sample_testcase):
        with app.app_context():
            resp = client.put(f'/testcases/{sample_testcase.id}', json={
                'name': '수정된 TC 이름',
                'result_status': 'Fail',
            }, headers=auth_headers)
            assert resp.status_code == 200

    def test_update_nonexistent_testcase(self, client, app, auth_headers):
        with app.app_context():
            resp = client.put('/testcases/99999999', json={'name': '없는 TC'},
                              headers=auth_headers)
            assert resp.status_code == 404

    def test_update_tc_number(self, client, app, auth_headers, sample_testcase):
        with app.app_context():
            resp = client.put(f'/testcases/{sample_testcase.id}', json={
                'tc_number': 'TC-999',
            }, headers=auth_headers)
            assert resp.status_code == 200
            # 실제 업데이트 확인
            from models import db, TestCase
            tc = db.session.get(TestCase, sample_testcase.id)
            assert tc.tc_number == 'TC-999'


class TestTestcasesDelete:
    """DELETE /testcases/<id> 엔드포인트"""

    def test_delete_testcase(self, client, app, auth_headers, sample_folder, admin_user):
        with app.app_context():
            from models import db, TestCase
            tc = TestCase(
                name='삭제 대상 TC',
                tc_number='TC-DEL-001',
                folder_id=sample_folder.id,
                creator_id=admin_user.id,
                environment='dev',  # environment 명시 (DashboardSummary 업데이트용)
            )
            db.session.add(tc)
            db.session.commit()
            tc_id = tc.id
            resp = client.delete(f'/testcases/{tc_id}', headers=auth_headers)
            assert resp.status_code == 200
            # 삭제 확인
            assert db.session.get(TestCase, tc_id) is None

    def test_delete_nonexistent_testcase(self, client, app, auth_headers):
        with app.app_context():
            resp = client.delete('/testcases/99999999', headers=auth_headers)
            assert resp.status_code in [404, 500]  # get_or_404 → HTTPException 재발생

    def test_delete_requires_auth(self, client, app, sample_testcase, guest_auth_headers):
        """게스트는 삭제 불가"""
        with app.app_context():
            resp = client.delete(f'/testcases/{sample_testcase.id}',
                                 headers=guest_auth_headers)
            assert resp.status_code in [403, 401]


class TestBulkOperations:
    """벌크 삭제/이동 엔드포인트"""

    def test_bulk_delete(self, client, app, auth_headers, sample_folder, admin_user):
        with app.app_context():
            from models import db, TestCase
            tc1 = TestCase(name='벌크삭제1', folder_id=sample_folder.id, creator_id=admin_user.id)
            tc2 = TestCase(name='벌크삭제2', folder_id=sample_folder.id, creator_id=admin_user.id)
            db.session.add_all([tc1, tc2])
            db.session.commit()
            ids = [tc1.id, tc2.id]
            resp = client.post('/testcases/bulk-delete', json={'testcase_ids': ids},
                               headers=auth_headers)
            assert resp.status_code == 200
            for tc_id in ids:
                assert db.session.get(TestCase, tc_id) is None

    def test_bulk_delete_empty_ids(self, client, app, auth_headers):
        with app.app_context():
            resp = client.post('/testcases/bulk-delete', json={'testcase_ids': []},
                               headers=auth_headers)
            assert resp.status_code in [200, 400]

    def test_bulk_move(self, client, app, auth_headers, sample_folder, sample_project, admin_user):
        with app.app_context():
            from models import db, TestCase, Folder
            target_folder = Folder(
                folder_name='이동 대상 폴더',
                folder_type='deployment_date',
                environment='dev',
                project_id=sample_project.id,
            )
            db.session.add(target_folder)
            tc = TestCase(name='이동 대상 TC', folder_id=sample_folder.id, creator_id=admin_user.id)
            db.session.add(tc)
            db.session.commit()
            target_id = target_folder.id
            tc_id = tc.id
            resp = client.post('/testcases/bulk-move', json={
                'testcase_ids': [tc_id],
                'folder_id': target_id,
            }, headers=auth_headers)
            assert resp.status_code == 200
            # 폴더 변경 확인
            moved_tc = db.session.get(TestCase, tc_id)
            assert moved_tc.folder_id == target_id
            # 정리
            db.session.delete(moved_tc)
            db.session.delete(target_folder)
            db.session.commit()


class TestFoldersCRUD:
    """폴더 CRUD 엔드포인트"""

    def test_get_folders(self, client, app, guest_auth_headers):
        with app.app_context():
            resp = client.get('/folders', headers=guest_auth_headers)
            assert resp.status_code == 200

    def test_create_folder(self, client, app, auth_headers, sample_project):
        with app.app_context():
            resp = client.post('/folders', json={
                'folder_name': 'API 생성 폴더',
                'folder_type': 'deployment_date',
                'environment': 'dev',
                'project_id': sample_project.id,
            }, headers=auth_headers)
            assert resp.status_code in [200, 201]
            data = json.loads(resp.data)
            folder_id = data.get('id')
            if folder_id:
                from models import db, Folder
                f = db.session.get(Folder, folder_id)
                if f:
                    db.session.delete(f)
                    db.session.commit()

    def test_delete_folder(self, client, app, auth_headers, sample_project):
        with app.app_context():
            from models import db, Folder
            folder = Folder(
                folder_name='삭제용 폴더',
                folder_type='environment',
                project_id=sample_project.id,
            )
            db.session.add(folder)
            db.session.commit()
            folder_id = folder.id
            resp = client.delete(f'/folders/{folder_id}', headers=auth_headers)
            assert resp.status_code in [200, 204]
