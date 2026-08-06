from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime
import os
import time
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy import inspect
from flasgger import Swagger

# 모델 및 Blueprint 임포트
from models import db
from routes.testcases import testcases_bp
from routes.testcases_extended import testcases_extended_bp
from routes.dashboard_extended import dashboard_extended_bp
from routes.automation import automation_bp
from routes.performance import performance_bp
from routes.folders import folders_bp
from routes.users import users_bp
from routes.auth import auth_bp
from routes.test_scripts import test_scripts_bp
from routes.jira_issues import jira_issues_bp
from routes.jira_integration import jira_bp
from routes.schedules import schedules_bp
from routes.queue import queue_bp
from routes.notifications import notifications_bp
from routes.analytics import analytics_bp
from routes.cicd import cicd_bp
from routes.test_data import test_data_bp
from routes.collaboration import collaboration_bp
from routes.dependencies import dependencies_bp
from routes.reports import reports_bp
from routes.settings import settings_bp
from utils.cors import setup_cors
from flask_jwt_extended import JWTManager
from utils.logger import get_logger
from utils.timezone_utils import get_kst_now, get_kst_isoformat
from utils.common_helpers import handle_options_request, create_cors_response
from utils.jwt_callbacks import setup_jwt_callbacks
from utils.response_utils import api_error
from utils.db_init import initialize_database
from utils.auth_decorators import admin_required
from config.app_config import configure_app, is_vercel_environment

# 로거 초기화
logger = get_logger(__name__)

# Flask 앱 생성
app = Flask(__name__)

# 앱 설정 적용
configure_app(app)

# Swagger 설정
swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Integrated Test Platform API",
        "description": "테스트/자동화 플랫폼 API를 Swagger UI에서 바로 호출할 수 있습니다.",
        "version": "1.0.0"
    },
    "schemes": ["http", "https"],
    "securityDefinitions": {
        "BearerAuth": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT 액세스 토큰을 `Bearer <token>` 형태로 전달"
        }
    }
}

swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec_1",
            "route": "/apidocs/swagger.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "swagger_ui": True,
    "specs_route": "/apidocs/",
    # 정적 자산 경로를 명시적으로 고정 (Flasgger 기본: /flasgger_static)
    "static_url_path": "/flasgger_static",
    "swagger_ui_css": "/flasgger_static/swagger-ui.css",
    "swagger_ui_bundle_js": "/flasgger_static/swagger-ui-bundle.js",
    "swagger_ui_standalone_preset_js": "/flasgger_static/swagger-ui-standalone-preset.js",
    "jquery_js": "/flasgger_static/lib/jquery.min.js",
}

swagger = Swagger(app, template=swagger_template, config=swagger_config)

# 환경 확인
is_vercel = is_vercel_environment()

# CORS 설정
if is_vercel:
    setup_cors(app)
else:
    # 로컬 환경에서는 모든 origin 허용
    CORS(app, origins=["*"], supports_credentials=False)

# 데이터베이스 초기화
db.init_app(app)
migrate = Migrate(app, db)

# JWT 초기화 및 콜백 설정
jwt = JWTManager(app)
setup_jwt_callbacks(jwt)

# SocketIO 초기화 (CORS 설정 포함)
# 기본값은 threading으로 고정 (eventlet에서 요청이 멈추는 현상 방지)
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    logger=True,
    engineio_logger=True
)

# OPTIONS 요청 전역 처리 (모든 라우트/Blueprint에 적용)
@app.before_request
def handle_options_globally():
    if request.method == 'OPTIONS':
        return handle_options_request()

# Blueprint 등록
app.register_blueprint(testcases_bp)
app.register_blueprint(testcases_extended_bp)
app.register_blueprint(dashboard_extended_bp)
app.register_blueprint(automation_bp)
app.register_blueprint(performance_bp)
app.register_blueprint(folders_bp)
app.register_blueprint(users_bp)
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(test_scripts_bp, url_prefix='/api/test-scripts')
app.register_blueprint(jira_issues_bp)
app.register_blueprint(jira_bp)
app.register_blueprint(schedules_bp)
app.register_blueprint(queue_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(cicd_bp)
app.register_blueprint(test_data_bp)
app.register_blueprint(collaboration_bp, url_prefix='/api/collaboration')
app.register_blueprint(dependencies_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(settings_bp)

# 기본 라우트들
@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    """헬스 체크 엔드포인트"""
    try:
        from utils.db_helper import get_database_info
        
        # 데이터베이스 연결 테스트
        db.session.execute(text('SELECT 1'))
        if 'mysql' in app.config['SQLALCHEMY_DATABASE_URI']:
            db.session.commit()
        db_status = 'connected'
        
        # 데이터베이스 정보 가져오기
        db_info = get_database_info(app.config['SQLALCHEMY_DATABASE_URI'])
        
        response = jsonify({
            'status': 'healthy', 
            'message': 'Test Platform Backend is running',
            'version': '2.7.0',
            'timestamp': get_kst_isoformat(get_kst_now()),
            'environment': 'production' if is_vercel else 'development',
            'database': {
                'status': db_status,
                'type': db_info.get('type', 'Unknown'),
                'info': db_info
            }
        })
        return response, 200
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Health check 오류: {error_msg}")
        
        try:
            from utils.db_helper import get_database_info
            db_info = get_database_info(app.config['SQLALCHEMY_DATABASE_URI'])
        except Exception:
            db_info = {}
        
        response = jsonify({
            'status': 'degraded',
            'message': 'Test Platform Backend is running (with database issues)',
            'version': '2.7.0',
            'timestamp': get_kst_isoformat(get_kst_now()),
            'environment': 'production' if is_vercel else 'development',
            'database': {
                'status': 'error',
                'type': db_info.get('type', 'Unknown'),
                'error': error_msg,
                'info': db_info
            },
            'note': 'Application is running but database connection failed'
        })
        return response, 503

@app.route('/cors-test', methods=['GET', 'OPTIONS'])
def cors_test():
    """CORS 테스트 엔드포인트"""
    try:
        response = jsonify({
            'status': 'success',
            'message': 'CORS test endpoint is working',
            'timestamp': get_kst_isoformat(get_kst_now()),
            'cors_enabled': True
        })
        return response, 200
    except Exception as e:
        response = jsonify({
            'status': 'error',
            'message': f'CORS test failed: {str(e)}',
            'timestamp': get_kst_isoformat(get_kst_now())
        })
        return response, 500

@app.route('/simple-cors-test', methods=['GET', 'POST', 'OPTIONS'])
def simple_cors_test():
    """간단한 CORS 테스트 엔드포인트"""
    response = jsonify({
        'status': 'success',
        'message': 'Simple CORS test successful',
        'method': request.method,
        'timestamp': get_kst_isoformat(get_kst_now())
    })
    return response, 200

@app.route('/ping', methods=['GET', 'OPTIONS'])
def ping():
    """가장 간단한 ping 엔드포인트 (데이터베이스 연결 없음)"""
    return jsonify({
        'status': 'success',
        'message': 'pong',
        'timestamp': get_kst_isoformat(get_kst_now()),
        'environment': 'production' if is_vercel else 'development'
    }), 200

@app.route('/init-db', methods=['GET', 'POST', 'OPTIONS'])
@admin_required
def init_database():
    """데이터베이스 초기화 엔드포인트"""
    result, status_code = initialize_database(app)
    response = jsonify(result)
    return response, status_code

@app.route('/db-status', methods=['GET', 'OPTIONS'])
@admin_required
def check_database_status():
    """데이터베이스 연결 상태 확인"""
    try:
        db.session.execute(text('SELECT 1'))
        
        try:
            inspector = inspect(db.engine)
            columns = inspector.get_columns('Users')
            
            table_info = {
                'table_name': 'Users',
                'columns': [],
                'last_login_exists': False
            }
            
            for col in columns:
                col_info = {
                    'name': col['name'],
                    'type': str(col['type']),
                    'nullable': col.get('nullable', 'unknown'),
                    'default': col.get('default', 'unknown')
                }
                table_info['columns'].append(col_info)
                
                if col['name'] == 'last_login':
                    table_info['last_login_exists'] = True
                    table_info['last_login_info'] = col_info
            
            try:
                from models import User
                sample_user = User.query.first()
                if sample_user:
                    table_info['sample_user'] = {
                        'id': sample_user.id,
                        'username': sample_user.username,
                        'last_login': sample_user.last_login.isoformat() if sample_user.last_login else None,
                        'created_at': sample_user.created_at.isoformat() if sample_user.created_at else None
                    }
            except Exception as user_error:
                table_info['user_query_error'] = str(user_error)
            
            return jsonify({
                'status': 'success',
                'database_connected': True,
                'table_info': table_info,
                'environment': 'production' if is_vercel else 'development',
                'database_url': app.config['SQLALCHEMY_DATABASE_URI'][:50] + '...' if len(app.config['SQLALCHEMY_DATABASE_URI']) > 50 else app.config['SQLALCHEMY_DATABASE_URI']
            }), 200
            
        except Exception as inspect_error:
            return jsonify({
                'status': 'error',
                'database_connected': True,
                'inspect_error': str(inspect_error),
                'environment': 'production' if is_vercel else 'development'
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'database_connected': False,
            'error': str(e),
            'environment': 'production' if is_vercel else 'development'
        }), 500

# 스크린샷 파일 제공 API는 클라우드 전환 시 S3/CDN으로 대체 예정
# @app.route('/screenshots/<path:filename>', methods=['GET'])
# def get_screenshot_file(filename):
#     """스크린샷 파일 직접 제공 - 클라우드 전환 시 S3로 대체"""
#     pass

# 앱 종료 시 스케줄러 정리
import atexit
from services.scheduler_service import scheduler_service

def shutdown_scheduler():
    """앱 종료 시 스케줄러 종료"""
    scheduler_service.shutdown()

atexit.register(shutdown_scheduler)

# 앱 시작 시 기존 스케줄 로드
def load_existing_schedules():
    """앱 시작 시 기존 활성 스케줄을 스케줄러에 로드"""
    try:
        from models import TestSchedule
        from routes.schedules import execute_scheduled_test
        import json
        
        active_schedules = TestSchedule.query.filter(
            TestSchedule.enabled == True,
            TestSchedule.active == True
        ).all()
        
        for schedule in active_schedules:
            execution_params = json.loads(schedule.execution_parameters) if schedule.execution_parameters else None
            scheduler_service.add_schedule(
                schedule.id,
                schedule.test_case_id,
                schedule.schedule_type,
                schedule.schedule_expression,
                schedule.environment,
                execution_params,
                execute_scheduled_test
            )
            logger.info(f"기존 스케줄 로드 완료: {schedule.name} (ID: {schedule.id})")
    except Exception as e:
        logger.error(f"기존 스케줄 로드 오류: {str(e)}")

# SocketIO 핸들러 등록
from socketio_handlers import register_socketio_handlers
register_socketio_handlers(socketio)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        load_existing_schedules()
    # SocketIO를 사용하여 앱 실행
    socketio.run(app, debug=True, host='0.0.0.0', port=8000, allow_unsafe_werkzeug=True) 
