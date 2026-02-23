"""
데이터 직렬화 유틸리티 함수들
"""
from datetime import datetime
from models import TestCase, Folder, Project, User, TestResult


def get_testcase_effective_project_id(tc):
    """테스트 케이스의 유효 프로젝트 ID: tc.project_id 우선, 없으면 연결된 폴더의 project_id"""
    if getattr(tc, 'project_id', None) is not None:
        return tc.project_id
    if getattr(tc, 'folder', None) and tc.folder:
        return tc.folder.project_id
    return None


def serialize_testcase(tc, include_relations=False):
    """테스트 케이스 직렬화. project_id는 테스트케이스 직접값 우선, 없으면 연결 폴더의 프로젝트로 연결."""
    effective_project_id = get_testcase_effective_project_id(tc)
    data = {
        'id': tc.id,
        'name': tc.name,
        'description': tc.description,
        'test_type': tc.test_type,
        'script_path': tc.script_path,
        'folder_id': tc.folder_id,
        'project_id': getattr(tc, 'project_id', None),
        'effective_project_id': effective_project_id,
        'main_category': tc.main_category,
        'sub_category': tc.sub_category,
        'detail_category': tc.detail_category,
        'pre_condition': tc.pre_condition,
        'expected_result': tc.expected_result,
        'remark': tc.remark,
        'test_steps': getattr(tc, 'test_steps', None),
        'automation_code_path': tc.automation_code_path,
        'environment': tc.environment,
        'result_status': getattr(tc, 'result_status', None),
        'created_at': tc.created_at.isoformat() if tc.created_at else None,
        'updated_at': tc.updated_at.isoformat() if tc.updated_at else None
    }
    if tc.folder:
        data['folder_name'] = tc.folder.folder_name
    if effective_project_id:
        proj = Project.query.get(effective_project_id)
        data['project_name'] = proj.name if proj else None
    if include_relations:
        data.update({
            'creator_id': getattr(tc, 'creator_id', None),
            'assignee_id': getattr(tc, 'assignee_id', None),
            'creator_name': tc.creator.get_display_name() if hasattr(tc, 'creator') and tc.creator else None,
            'assignee_name': tc.assignee.get_display_name() if hasattr(tc, 'assignee') and tc.assignee else None,
        })
    return data


def serialize_folder(f):
    """폴더 직렬화 (폴더가 속한 프로젝트 ID 포함)"""
    return {
        'id': f.id,
        'folder_name': f.folder_name,
        'parent_folder_id': f.parent_folder_id,
        'project_id': getattr(f, 'project_id', None),
        'folder_type': f.folder_type,
        'environment': f.environment,
        'deployment_date': f.deployment_date.strftime('%Y-%m-%d') if f.deployment_date else None,
        'created_at': f.created_at.isoformat() if f.created_at else None
    }


def serialize_project(p):
    """프로젝트 직렬화"""
    return {
        'id': p.id,
        'name': p.name,
        'description': p.description
    }


def serialize_user(u, include_sensitive=False):
    """사용자 직렬화"""
    data = {
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'first_name': u.first_name,
        'last_name': u.last_name,
        'role': u.role,
        'is_active': u.is_active,
        'created_at': u.created_at.isoformat() if u.created_at else None
    }
    
    if include_sensitive:
        data.update({
            'last_login': u.last_login.isoformat() if u.last_login else None
        })
    
    return data


def serialize_test_result(tr):
    """테스트 결과 직렬화"""
    return {
        'id': tr.id,
        'test_case_id': tr.test_case_id,
        'result': tr.result,
        'execution_time': tr.execution_time,
        'notes': getattr(tr, 'notes', None),
        'created_at': tr.created_at.isoformat() if tr.created_at else None
    }

