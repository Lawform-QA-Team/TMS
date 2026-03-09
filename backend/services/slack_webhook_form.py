"""
슬랙 웹훅 메시지 폼(Block Kit) 전용 모듈.
알림 타입별 payload 구조를 여기서만 관리합니다.
"""
from typing import Optional
# 알림 타입별 이모지 (폼에서만 사용)
EMOJI_MAP = {
    "assignment": "👤",
    "mention": "💬",
    "test_failed": "❌",
    "test_completed": "✅",
    "test_started": "🚀",
    "schedule_run": "⏰",
    "test_status_changed": "🔄",
}


def _header_block(title_text: str):
    """공통 header 블록."""
    return {
        "type": "header",
        "text": {"type": "plain_text", "text": title_text, "emoji": True},
    }


def _section_block(text: str):
    """공통 section 블록 (mrkdwn)."""
    return {"type": "section", "text": {"type": "mrkdwn", "text": text}}


def build_assignment_payload(
    title_text: str,
    test_case_name: str,
    old_assignee_display: str,
    new_assignee_display: str,
):
    """
    담당자 지정(assignment) 알림용 슬랙 payload.
    Returns: {"text": str, "blocks": list}
    """
    body = (
        f"테스트 케이스 : {test_case_name} \n "
        f"담당자 변경: {old_assignee_display} -> {new_assignee_display} \n "
        f"메시지: {new_assignee_display}님,{test_case_name} 테스트 케이스의 담당자로 지정되었습니다."
    )
    blocks = [_header_block(title_text), _section_block(body)]
    return {"text": title_text, "blocks": blocks}


def build_default_payload(
    title_text: str,
    body_text: str,
):
    """
    그 외 알림 타입용 슬랙 payload (header + section 한 블록).
    Returns: {"text": str, "blocks": list}
    """
    blocks = [_header_block(title_text), _section_block(body_text)]
    return {"text": title_text, "blocks": blocks}


def build_slack_payload(
    notification_type: str,
    title: str,
    message: str,
    *,
    # assignment 전용
    test_case_name: Optional[str] = None,
    old_assignee_display: Optional[str] = None,
    new_assignee_display: Optional[str] = None,
    # 기본 알림 전용
    username: Optional[str] = None,
    related_test_case_name: Optional[str] = None,
):
    """
    알림 타입과 인자에 따라 슬랙 웹훅용 payload를 생성합니다.
    Returns: {"text": str, "blocks": list} (requests.post에 그대로 전달 가능)
    """
    emoji = EMOJI_MAP.get(notification_type, "🔔")

    if (
        notification_type == "assignment"
        and test_case_name is not None
        and new_assignee_display is not None
    ):
        title_text = title or "테스트 케이스 담당자 지정"
        return build_assignment_payload(
            title_text=title_text,
            test_case_name=test_case_name,
            old_assignee_display=old_assignee_display or "(없음)",
            new_assignee_display=new_assignee_display,
        )

    # 그 외 알림: header + section 한 블록
    title_text = f"{emoji} {title}"
    body_parts = []
    if username:
        body_parts.append(f"사용자: {username}")
    body_parts.append(f"타입: {notification_type}")
    body_parts.append(f"메시지: {message}")
    if related_test_case_name:
        body_parts.append(f"관련 테스트 케이스: {related_test_case_name}")
    body_text = " \n ".join(body_parts)
    return build_default_payload(title_text=title_text, body_text=body_text)
