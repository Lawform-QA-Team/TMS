"""
알림 서비스
알림 생성 및 전송을 담당하는 서비스
"""
from models import db, Notification, NotificationSettings, User, TestCase, TestResult
from utils.timezone_utils import get_kst_now
from utils.logger import get_logger
from services.slack_webhook_form import build_slack_payload
import json
import os
import requests

logger = get_logger(__name__)

class NotificationService:
    """알림 서비스 싱글톤"""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(NotificationService, cls).__new__(cls)
        return cls._instance
    
    def create_notification(self, user_id, notification_type, title, message, 
                           related_test_case_id=None, related_automation_test_id=None,
                           related_performance_test_id=None, related_test_result_id=None,
                           priority='medium', channels='in_app', metadata=None):
        """
        알림 생성
        
        Args:
            user_id: 사용자 ID
            notification_type: 알림 타입
            title: 알림 제목
            message: 알림 메시지
            related_test_case_id: 관련 테스트 케이스 ID
            related_automation_test_id: 관련 자동화 테스트 ID
            related_performance_test_id: 관련 성능 테스트 ID
            related_test_result_id: 관련 테스트 결과 ID
            priority: 우선순위
            channels: 알림 채널
            metadata: Slack 등 전송 시 사용할 추가 데이터 (예: assignment 시 test_case_name, old_assignee_display, new_assignee_display)
        
        Returns:
            Notification: 생성된 알림 객체
        """
        try:
            notification = Notification(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                related_test_case_id=related_test_case_id,
                related_automation_test_id=related_automation_test_id,
                related_performance_test_id=related_performance_test_id,
                related_test_result_id=related_test_result_id,
                priority=priority,
                channels=channels
            )
            
            db.session.add(notification)
            db.session.commit()
            
            # WebSocket을 통해 실시간 알림 전송
            self._send_realtime_notification(notification)
            
            # 슬랙 웹훅으로 알림 전송 (설정된 경우)
            self._send_slack_notification(notification, user_id, metadata=metadata)
            
            logger.info(f"알림 생성 완료: {title} (User: {user_id})")
            return notification
            
        except Exception as e:
            logger.error(f"알림 생성 오류: {str(e)}")
            db.session.rollback()
            raise

    def _is_channel_enabled(self, user_settings, notification_type, channel):
        """채널별 알림 활성화 여부 확인"""
        if not user_settings:
            return True

        # 전역 채널 설정
        if channel == 'in_app' and not user_settings.in_app_enabled:
            return False
        if channel == 'slack' and not user_settings.slack_enabled:
            return False
        if channel == 'email' and not user_settings.email_enabled:
            return False

        # 타입별 상세 설정
        try:
            settings = json.loads(user_settings.settings) if user_settings.settings else {}
        except Exception:
            settings = {}

        type_settings = settings.get(notification_type, {})
        if not type_settings:
            return True

        return bool(type_settings.get(channel, True))
    
    def notify_test_failed(self, test_case_id, test_result_id, user_id=None):
        """테스트 실패 알림"""
        try:
            test_case = db.session.get(TestCase, test_case_id)
            if not test_case:
                return
            
            # 담당자에게 알림
            target_user_id = user_id or test_case.assignee_id or test_case.creator_id
            if not target_user_id:
                return
            
            title = f"테스트 실패: {test_case.name}"
            message = f"테스트 케이스 '{test_case.name}'가 실패했습니다."
            
            notification = self.create_notification(
                user_id=target_user_id,
                notification_type='test_failed',
                title=title,
                message=message,
                related_test_case_id=test_case_id,
                related_test_result_id=test_result_id,
                priority='high'
            )
            
            return notification
            
        except Exception as e:
            logger.error(f"테스트 실패 알림 생성 오류: {str(e)}")
    
    def notify_test_completed(self, test_case_id, test_result_id, result_status, user_id=None):
        """테스트 완료 알림"""
        try:
            test_case = db.session.get(TestCase, test_case_id)
            if not test_case:
                return
            
            target_user_id = user_id or test_case.assignee_id or test_case.creator_id
            if not target_user_id:
                return
            
            status_text = '성공' if result_status == 'Pass' else '실패'
            title = f"테스트 완료: {test_case.name}"
            message = f"테스트 케이스 '{test_case.name}'가 {status_text}했습니다."
            
            priority = 'medium' if result_status == 'Pass' else 'high'
            
            notification = self.create_notification(
                user_id=target_user_id,
                notification_type='test_completed',
                title=title,
                message=message,
                related_test_case_id=test_case_id,
                related_test_result_id=test_result_id,
                priority=priority
            )
            
            return notification
            
        except Exception as e:
            logger.error(f"테스트 완료 알림 생성 오류: {str(e)}")
    
    def notify_test_started(self, test_case_id, user_id=None):
        """테스트 시작 알림"""
        try:
            test_case = db.session.get(TestCase, test_case_id)
            if not test_case:
                return
            
            target_user_id = user_id or test_case.assignee_id or test_case.creator_id
            if not target_user_id:
                return
            
            title = f"테스트 시작: {test_case.name}"
            message = f"테스트 케이스 '{test_case.name}' 실행이 시작되었습니다."
            
            notification = self.create_notification(
                user_id=target_user_id,
                notification_type='test_started',
                title=title,
                message=message,
                related_test_case_id=test_case_id,
                priority='low'
            )
            
            return notification
            
        except Exception as e:
            logger.error(f"테스트 시작 알림 생성 오류: {str(e)}")
    
    def notify_schedule_run(self, schedule_id, test_case_id, result_status, user_id=None):
        """스케줄 실행 알림"""
        try:
            test_case = db.session.get(TestCase, test_case_id)
            if not test_case:
                return
            
            target_user_id = user_id or test_case.assignee_id or test_case.creator_id
            if not target_user_id:
                return
            
            status_text = '성공' if result_status == 'success' else '실패'
            title = f"스케줄 실행 완료: {test_case.name}"
            message = f"스케줄된 테스트 '{test_case.name}' 실행이 {status_text}했습니다."
            
            notification = self.create_notification(
                user_id=target_user_id,
                notification_type='schedule_run',
                title=title,
                message=message,
                related_test_case_id=test_case_id,
                priority='medium'
            )
            
            return notification
            
        except Exception as e:
            logger.error(f"스케줄 실행 알림 생성 오류: {str(e)}")
    
    def notify_test_status_changed(self, test_case_id, old_status, new_status, changed_by_user_id=None):
        """테스트 케이스 상태 변경 알림 (작성자와 담당자에게 발송)"""
        try:
            test_case = db.session.get(TestCase, test_case_id)
            if not test_case:
                return
            
            # 상태 텍스트 매핑
            status_map = {
                'pending': 'Pending',
                'passed': 'Pass',
                'failed': 'Fail',
                'blocked': 'Blocked',
                'Pass': 'Pass',
                'Fail': 'Fail',
                'Pending': 'Pending',
                'Blocked': 'Blocked'
            }
            
            old_status_text = status_map.get(old_status, old_status)
            new_status_text = status_map.get(new_status, new_status)
            
            # 변경한 사용자 정보 가져오기
            changed_by_user = None
            if changed_by_user_id:
                changed_by_user = db.session.get(User, changed_by_user_id)
            changed_by_name = changed_by_user.username if changed_by_user else '시스템'
            
            title = f"테스트 케이스 상태 변경: {test_case.name}"
            message = f"테스트 케이스 '{test_case.name}'의 상태가 '{old_status_text}'에서 '{new_status_text}'로 변경되었습니다.\n변경자: {changed_by_name}"
            
            # 우선순위 설정 (실패 상태일 때 높은 우선순위)
            priority = 'high' if new_status in ['Fail', 'failed'] else 'medium'
            
            notifications = []
            
            # 작성자에게 알림 발송
            if test_case.creator_id:
                try:
                    notification = self.create_notification(
                        user_id=test_case.creator_id,
                        notification_type='test_status_changed',
                        title=title,
                        message=message,
                        related_test_case_id=test_case_id,
                        priority=priority,
                        channels='all'  # in_app, slack 모두 발송
                    )
                    notifications.append(notification)
                    logger.info(f"테스트 케이스 상태 변경 알림 발송: 작성자 (User {test_case.creator_id})")
                except Exception as e:
                    logger.error(f"작성자 알림 발송 오류: {str(e)}")
            
            # 담당자에게 알림 발송 (작성자와 다른 경우에만)
            if test_case.assignee_id and test_case.assignee_id != test_case.creator_id:
                try:
                    notification = self.create_notification(
                        user_id=test_case.assignee_id,
                        notification_type='test_status_changed',
                        title=title,
                        message=message,
                        related_test_case_id=test_case_id,
                        priority=priority,
                        channels='all'  # in_app, slack 모두 발송
                    )
                    notifications.append(notification)
                    logger.info(f"테스트 케이스 상태 변경 알림 발송: 담당자 (User {test_case.assignee_id})")
                except Exception as e:
                    logger.error(f"담당자 알림 발송 오류: {str(e)}")
            
            return notifications
            
        except Exception as e:
            logger.error(f"테스트 케이스 상태 변경 알림 생성 오류: {str(e)}")
            return []
    
    def _send_realtime_notification(self, notification):
        """WebSocket을 통해 실시간 알림 전송"""
        try:
            from app import socketio
            user_settings = NotificationSettings.query.filter_by(user_id=notification.user_id).first()
            if not self._is_channel_enabled(user_settings, notification.notification_type, 'in_app'):
                logger.info(f"🔔 인앱 알림 비활성화: User {notification.user_id}, type={notification.notification_type}")
                return
            
            # 해당 사용자에게만 알림 전송
            socketio.emit('notification', notification.to_dict(), room=f'user_{notification.user_id}')
            logger.debug(f"실시간 알림 전송: User {notification.user_id}")
            
        except Exception as e:
            logger.error(f"실시간 알림 전송 오류: {str(e)}")
    
    def _send_slack_notification(self, notification, user_id, metadata=None):
        """슬랙 웹훅을 통해 알림 전송. metadata는 assignment 등 타입별 Block Kit 포맷에 사용."""
        try:
            # 사용자별 슬랙 설정 확인
            user_settings = NotificationSettings.query.filter_by(user_id=user_id).first()
            if not self._is_channel_enabled(user_settings, notification.notification_type, 'slack'):
                logger.info(f"🔔 슬랙 알림 비활성화: User {user_id}, type={notification.notification_type}")
                return
            
            # 슬랙 웹훅 URL 확인 (사용자별 설정 우선, 없으면 전역 환경 변수)
            slack_webhook_url = None
            slack_enabled = False
            
            if user_settings:
                # 사용자별 설정이 있는 경우
                slack_enabled = user_settings.slack_enabled
                if user_settings.slack_webhook_url:
                    slack_webhook_url = user_settings.slack_webhook_url
                    logger.info(f"🔔 사용자별 슬랙 웹훅 URL 사용: User {user_id}, enabled={slack_enabled}")
                else:
                    # 사용자별 URL이 없으면 전역 환경 변수 사용
                    slack_webhook_url = os.getenv('SLACK_WEBHOOK_URL')
                    logger.info(f"🔔 전역 슬랙 웹훅 URL 사용: User {user_id}, enabled={slack_enabled}")
            else:
                # 사용자별 설정이 없는 경우 전역 환경 변수 사용
                slack_webhook_url = os.getenv('SLACK_WEBHOOK_URL')
                logger.info(f"🔔 사용자 설정 없음, 전역 슬랙 웹훅 URL 사용: User {user_id}")
            
            # 슬랙 웹훅 URL이 없으면 건너뛰기
            if not slack_webhook_url:
                logger.warning(f"⚠️ 슬랙 웹훅 URL이 설정되지 않음: User {user_id}, 환경변수 확인 필요")
                return
            
            # 사용자별 설정이 있고 slack_enabled가 False면 건너뛰기
            if user_settings and not slack_enabled:
                logger.info(f"🔔 사용자 {user_id}의 슬랙 알림이 비활성화되어 있음 (slack_enabled=False)")
                return
            
            logger.info(f"🔔 슬랙 알림 전송 시도: User {user_id}, URL={slack_webhook_url[:30]}...")
            
            # 사용자 정보 가져오기
            user = db.session.get(User, user_id)
            username = user.username if user else 'Unknown User'
            
            # 슬랙 폼은 slack_webhook_form 모듈에서 통일 관리
            if notification.notification_type == 'assignment' and (metadata or notification.related_test_case_id):
                test_case_name = None
                old_assignee_display = None
                new_assignee_display = None
                if metadata:
                    test_case_name = metadata.get('test_case_name')
                    old_assignee_display = metadata.get('old_assignee_display')
                    new_assignee_display = metadata.get('new_assignee_display')
                if not test_case_name and notification.related_test_case_id:
                    tc = db.session.get(TestCase, notification.related_test_case_id)
                    if tc:
                        test_case_name = tc.name or (f"테스트 케이스 #{tc.id}")
                if new_assignee_display is None and notification.user_id:
                    u = db.session.get(User, notification.user_id)
                    new_assignee_display = u.get_display_name() if u else str(notification.user_id)
                if old_assignee_display is None and metadata and metadata.get('old_assignee_id'):
                    u = db.session.get(User, metadata['old_assignee_id'])
                    old_assignee_display = u.get_display_name() if u else str(metadata['old_assignee_id'])
                slack_message = build_slack_payload(
                    notification.notification_type,
                    notification.title or '',
                    notification.message or '',
                    test_case_name=test_case_name,
                    old_assignee_display=old_assignee_display,
                    new_assignee_display=new_assignee_display,
                )
            else:
                related_test_case_name = None
                if notification.related_test_case_id:
                    tc = db.session.get(TestCase, notification.related_test_case_id)
                    if tc:
                        related_test_case_name = tc.name
                slack_message = build_slack_payload(
                    notification.notification_type,
                    notification.title or '',
                    notification.message or '',
                    username=username,
                    related_test_case_name=related_test_case_name,
                )
            
            # 슬랙 웹훅으로 전송
            response = requests.post(
                slack_webhook_url,
                json=slack_message,
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"슬랙 알림 전송 성공: User {user_id}, Notification {notification.id}")
            else:
                logger.warning(
                    f"슬랙 알림 전송 실패: Status {response.status_code}, Response: {response.text}. "
                    "URL 유효성·앱 권한·Incoming Webhooks 활성화를 확인하세요."
                )
                
        except requests.exceptions.RequestException as e:
            logger.error(f"슬랙 웹훅 요청 오류: {str(e)}")
        except Exception as e:
            logger.error(f"슬랙 알림 전송 오류: {str(e)}", exc_info=True)
    
    def get_user_notifications(self, user_id, unread_only=False, limit=50):
        """사용자 알림 조회"""
        try:
            logger.info(f"🔍 알림 서비스 조회: user_id={user_id}, unread_only={unread_only}, limit={limit}")
            
            query = Notification.query.filter_by(user_id=user_id)
            
            # 전체 알림 수 확인
            total_count = query.count()
            logger.info(f"🔍 사용자 {user_id}의 전체 알림 수: {total_count}개")
            
            if unread_only:
                query = query.filter_by(read=False)
            
            notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
            
            logger.info(f"🔍 조회된 알림 수: {len(notifications)}개")
            
            result = [n.to_dict() for n in notifications]
            logger.info(f"🔍 변환된 알림 수: {len(result)}개")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ 알림 조회 오류: {str(e)}", exc_info=True)
            return []
    
    def mark_as_read(self, notification_id, user_id):
        """알림 읽음 처리"""
        try:
            notification = Notification.query.filter_by(
                id=notification_id,
                user_id=user_id
            ).first()
            
            if notification:
                notification.read = True
                notification.read_at = get_kst_now()
                db.session.commit()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"알림 읽음 처리 오류: {str(e)}")
            db.session.rollback()
            return False
    
    def mark_all_as_read(self, user_id):
        """사용자의 모든 알림 읽음 처리"""
        try:
            Notification.query.filter_by(
                user_id=user_id,
                read=False
            ).update({'read': True, 'read_at': get_kst_now()})
            
            db.session.commit()
            return True
            
        except Exception as e:
            logger.error(f"전체 알림 읽음 처리 오류: {str(e)}")
            db.session.rollback()
            return False

# 전역 알림 서비스 인스턴스
notification_service = NotificationService()

