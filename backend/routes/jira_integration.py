"""
JIRA 연동 API 엔드포인트
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json
from utils.jira_client import JiraClient, JiraIntegrationService
from utils.auth_decorators import user_required
from models import db, JiraIntegration, SystemConfig

jira_bp = Blueprint('jira', __name__, url_prefix='/api/jira')

# JIRA 클라이언트 초기화
jira_client = JiraClient()
jira_service = JiraIntegrationService(jira_client)

@jira_bp.route('/config', methods=['GET'])
@user_required
def get_jira_config():
    """Jira Cloud 연동 설정 조회"""
    try:
        url_cfg   = SystemConfig.query.filter_by(key='jira_url').first()
        email_cfg = SystemConfig.query.filter_by(key='jira_email').first()
        token_cfg = SystemConfig.query.filter_by(key='jira_api_token').first()

        is_configured = bool(
            url_cfg and url_cfg.value and
            email_cfg and email_cfg.value and
            token_cfg and token_cfg.value
        )

        return jsonify({
            'success': True,
            'data': {
                'is_configured': is_configured,
                'url':       url_cfg.value   if url_cfg   else '',
                'email':     email_cfg.value if email_cfg else '',
                'has_token': bool(token_cfg and token_cfg.value)
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@jira_bp.route('/config', methods=['POST'])
@user_required
def save_jira_config():
    """Jira Cloud 연동 설정 저장"""
    try:
        data  = request.get_json()
        url   = (data.get('url') or '').rstrip('/')
        email = (data.get('email') or '').strip()
        token = (data.get('token') or '').strip()

        if not url or not email or not token:
            return jsonify({'success': False, 'error': 'URL, 이메일, API 토큰은 필수입니다.'}), 400

        for key, value in [('jira_url', url), ('jira_email', email), ('jira_api_token', token)]:
            cfg = SystemConfig.query.filter_by(key=key).first()
            if cfg:
                cfg.value = value
            else:
                db.session.add(SystemConfig(key=key, value=value))

        db.session.commit()
        return jsonify({'success': True, 'message': 'Jira 설정이 저장되었습니다.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@jira_bp.route('/config/test', methods=['POST'])
@user_required
def test_jira_connection():
    """Jira Cloud 연결 테스트"""
    try:
        import requests as req
        from requests.auth import HTTPBasicAuth

        data  = request.get_json()
        url   = (data.get('url') or '').rstrip('/')
        email = (data.get('email') or '').strip()
        token = (data.get('token') or '').strip()

        if not url or not email or not token:
            return jsonify({'success': False, 'error': 'URL, 이메일, API 토큰은 필수입니다.'}), 400

        resp = req.get(
            f'{url}/rest/api/3/myself',
            auth=HTTPBasicAuth(email, token),
            headers={'Accept': 'application/json'},
            timeout=10
        )

        if resp.status_code == 200:
            display_name = resp.json().get('displayName', email)
            return jsonify({
                'success': True,
                'message': f'연결 성공! ({display_name})'
            })
        elif resp.status_code == 401:
            return jsonify({'success': False, 'error': '인증 실패. 이메일 또는 API 토큰을 확인하세요.'}), 401
        else:
            return jsonify({'success': False, 'error': f'연결 실패 (HTTP {resp.status_code})'}), 400

    except Exception as e:
        return jsonify({'success': False, 'error': f'연결 오류: {str(e)}'}), 500


@jira_bp.route('/health', methods=['GET'])
def health_check():
    """JIRA 서버 상태 확인"""
    try:
        health_status = jira_client.health_check()
        return jsonify({
            'success': True,
            'data': health_status
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@jira_bp.route('/projects', methods=['GET'])
@user_required
def get_projects():
    """JIRA 프로젝트 목록 조회"""
    try:
        projects = jira_client.get_projects()
        return jsonify({
            'success': True,
            'data': projects
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@jira_bp.route('/sync-issue', methods=['POST'])
@user_required
def sync_issue():
    """이슈를 데이터베이스에 동기화"""
    try:
        data = request.get_json()
        issue_key = data.get('issue_key')
        
        if not issue_key:
            return jsonify({
                'success': False,
                'error': 'issue_key가 필요합니다.'
            }), 400
        
        # JIRA에서 이슈 정보 가져오기
        issue_data = jira_client.get_issue(issue_key)
        
        if not issue_data:
            return jsonify({
                'success': False,
                'error': '이슈를 찾을 수 없습니다.'
            }), 404
        
        # 데이터베이스에 저장 또는 업데이트
        jira_integration = JiraIntegration.query.filter_by(jira_issue_key=issue_key).first()
        
        if not jira_integration:
            jira_integration = JiraIntegration()
            jira_integration.jira_issue_key = issue_key
            jira_integration.created_at = datetime.utcnow()
        
        # 이슈 정보 업데이트
        fields = issue_data.get('fields', {})
        jira_integration.summary = fields.get('summary', '')
        jira_integration.description = fields.get('description', '')
        jira_integration.status = fields.get('status', {}).get('name', '')
        jira_integration.priority = fields.get('priority', {}).get('name', '')
        jira_integration.issue_type = fields.get('issuetype', {}).get('name', '')
        jira_integration.assignee_account_id = fields.get('assignee', {}).get('accountId') if fields.get('assignee') else None
        jira_integration.labels = json.dumps(fields.get('labels', [])) if fields.get('labels') else None
        jira_integration.updated_at = datetime.utcnow()
        jira_integration.last_sync_at = datetime.utcnow()
        
        if not jira_integration.id:
            db.session.add(jira_integration)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '이슈가 성공적으로 동기화되었습니다.',
            'data': {
                'id': jira_integration.id,
                'jira_issue_key': jira_integration.jira_issue_key,
                'summary': jira_integration.summary
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@jira_bp.route('/search', methods=['GET'])
@user_required
def search_issues():
    """이슈 검색"""
    try:
        jql = request.args.get('jql', '')
        start_at = int(request.args.get('startAt', 0))
        max_results = int(request.args.get('maxResults', 50))
        
        results = jira_client.search_issues(jql, start_at, max_results)
        
        return jsonify({
            'success': True,
            'data': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@jira_bp.route('/integrations', methods=['GET'])
@user_required
def get_integrations():
    """JIRA 연동 목록 조회"""
    try:
        test_id = request.args.get('test_id')
        test_type = request.args.get('test_type')
        
        query = JiraIntegration.query
        
        if test_id and test_type:
            if test_type == 'testcase':
                query = query.filter_by(test_case_id=test_id)
            elif test_type == 'automation':
                query = query.filter_by(automation_test_id=test_id)
            elif test_type == 'performance':
                query = query.filter_by(performance_test_id=test_id)
        
        integrations = query.all()
        
        return jsonify({
            'success': True,
            'data': [integration.to_dict() for integration in integrations]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@jira_bp.route('/integrations/<int:integration_id>', methods=['DELETE'])
@user_required
def delete_integration(integration_id):
    """JIRA 연동 삭제"""
    try:
        integration = db.session.get(JiraIntegration, integration_id)
        if not integration:
            return jsonify({
                'success': False,
                'error': '연동 정보를 찾을 수 없습니다.'
            }), 404
        
        db.session.delete(integration)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '연동 정보가 삭제되었습니다.'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@jira_bp.route('/sync', methods=['POST'])
@user_required
def sync_issues():
    """이슈 상태 동기화"""
    try:
        data = request.get_json()
        integration_id = data.get('integration_id')
        
        if integration_id:
            # 특정 연동 정보 동기화
            integration = db.session.get(JiraIntegration, integration_id)
            if not integration:
                return jsonify({
                    'success': False,
                    'error': '연동 정보를 찾을 수 없습니다.'
                }), 404
            
            # JIRA에서 최신 이슈 정보 조회
            issue = jira_client.get_issue(integration.jira_issue_key)
            
            # 상태 업데이트
            integration.status = issue['fields']['status']['name']
            integration.updated_at = datetime.utcnow()
            integration.last_sync_at = datetime.utcnow()
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'data': integration.to_dict()
            })
        else:
            # 모든 연동 정보 동기화
            integrations = JiraIntegration.query.all()
            synced_count = 0
            
            for integration in integrations:
                try:
                    issue = jira_client.get_issue(integration.jira_issue_key)
                    integration.status = issue['fields']['status']['name']
                    integration.last_sync_at = datetime.utcnow()
                    synced_count += 1
                except Exception as e:
                    print(f"동기화 실패: {integration.jira_issue_key} - {str(e)}")
                    continue
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'{synced_count}개의 이슈가 동기화되었습니다.'
            })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@jira_bp.route('/auto-create', methods=['POST'])
@user_required
def auto_create_issue():
    """테스트 실패 시 자동 이슈 생성"""
    try:
        data = request.get_json()
        
        test_id = data.get('test_id')
        test_type = data.get('test_type')
        test_name = data.get('test_name')
        test_result = data.get('test_result')
        error_message = data.get('error_message')
        
        if not all([test_id, test_type, test_name, test_result]):
            return jsonify({
                'success': False,
                'error': '필수 필드가 누락되었습니다.'
            }), 400
        
        # 테스트 실패 시에만 이슈 생성
        if test_result not in ['Fail', 'Error']:
            return jsonify({
                'success': True,
                'message': '테스트가 성공했으므로 이슈를 생성하지 않습니다.',
                'data': None
            })
        
        # 자동 이슈 생성
        issue = jira_service.create_issue_from_test_result(
            test_id=test_id,
            test_type=test_type,
            test_name=test_name,
            test_result=test_result,
            error_message=error_message
        )
        
        if issue:
            # 데이터베이스에 연동 정보 저장
            jira_integration = JiraIntegration(
                test_case_id=test_id if test_type == 'testcase' else None,
                automation_test_id=test_id if test_type == 'automation' else None,
                performance_test_id=test_id if test_type == 'performance' else None,
                jira_issue_key=issue['key'],
                jira_issue_id=issue['id'],
                jira_project_key=issue['fields']['project']['key'],
                issue_type='Bug',
                status=issue['fields']['status']['name'],
                priority='High' if test_result == 'Error' else 'Medium',
                summary=issue['fields']['summary'],
                description=issue['fields']['description'],
                last_sync_at=datetime.utcnow()
            )
            
            db.session.add(jira_integration)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'data': {
                    'issue': issue,
                    'integration_id': jira_integration.id
                }
            }), 201
        else:
            return jsonify({
                'success': True,
                'message': '이슈 생성 조건을 만족하지 않습니다.',
                'data': None
            })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

