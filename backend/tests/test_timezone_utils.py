"""
utils/timezone_utils.py 화이트박스 단위 테스트
DB/Flask 의존 없음 - 순수 함수 테스트
"""
import pytest
from datetime import datetime, timezone, timedelta
import pytz
from utils.timezone_utils import (
    get_kst_now,
    get_kst_datetime,
    format_kst_datetime,
    get_kst_isoformat,
    get_kst_timestamp,
    get_kst_date_string,
    get_kst_datetime_string,
    KST,
)


class TestGetKstNow:
    """get_kst_now() 분기 테스트"""

    def test_returns_datetime(self):
        result = get_kst_now()
        assert isinstance(result, datetime)

    def test_timezone_is_kst(self):
        result = get_kst_now()
        # KST는 UTC+9
        assert result.tzinfo is not None
        offset = result.utcoffset()
        assert offset == timedelta(hours=9)

    def test_is_recent(self):
        """현재 시각과 5초 이내 차이"""
        result = get_kst_now()
        now_utc = datetime.now(timezone.utc).astimezone(KST)
        diff = abs((result - now_utc).total_seconds())
        assert diff < 5


class TestGetKstDatetime:
    """get_kst_datetime() 분기 테스트"""

    def test_none_input_returns_none(self):
        assert get_kst_datetime(None) is None

    def test_utc_aware_converts_correctly(self):
        utc_dt = datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        result = get_kst_datetime(utc_dt)
        # KST = UTC+9
        assert result.hour == 9
        assert result.day == 1

    def test_naive_datetime_treated_as_utc(self):
        """timezone 없는 datetime은 UTC로 가정"""
        naive_dt = datetime(2025, 1, 1, 0, 0, 0)
        result = get_kst_datetime(naive_dt)
        assert result.hour == 9

    def test_already_kst_aware(self):
        kst_dt = datetime(2025, 6, 15, 12, 0, 0, tzinfo=KST)
        result = get_kst_datetime(kst_dt)
        assert result.hour == 12
        assert result.tzinfo is not None

    def test_midnight_utc_becomes_9am_kst(self):
        utc_dt = datetime(2025, 3, 10, 0, 0, 0, tzinfo=timezone.utc)
        result = get_kst_datetime(utc_dt)
        assert result.hour == 9
        assert result.month == 3
        assert result.day == 10

    def test_late_night_utc_crosses_day(self):
        """UTC 23:00 → KST 다음날 08:00"""
        utc_dt = datetime(2025, 3, 10, 23, 0, 0, tzinfo=timezone.utc)
        result = get_kst_datetime(utc_dt)
        assert result.hour == 8
        assert result.day == 11


class TestFormatKstDatetime:
    """format_kst_datetime() 분기 테스트"""

    def test_none_returns_none(self):
        assert format_kst_datetime(None) is None

    def test_default_format(self):
        utc_dt = datetime(2025, 7, 15, 10, 30, 45, tzinfo=timezone.utc)
        result = format_kst_datetime(utc_dt)
        # KST = UTC+9 → 19:30:45
        assert result == '2025-07-15 19:30:45'

    def test_custom_format(self):
        utc_dt = datetime(2025, 7, 15, 10, 30, 45, tzinfo=timezone.utc)
        result = format_kst_datetime(utc_dt, format_str='%Y/%m/%d')
        assert result == '2025/07/15'

    def test_naive_datetime(self):
        naive_dt = datetime(2025, 1, 1, 15, 0, 0)
        result = format_kst_datetime(naive_dt)
        # UTC 15:00 → KST 00:00 (다음날)
        assert result == '2025-01-02 00:00:00'


class TestGetKstIsoformat:
    """get_kst_isoformat() 분기 테스트"""

    def test_none_returns_none(self):
        assert get_kst_isoformat(None) is None

    def test_returns_string(self):
        utc_dt = datetime(2025, 7, 15, 0, 0, 0, tzinfo=timezone.utc)
        result = get_kst_isoformat(utc_dt)
        assert isinstance(result, str)
        # KST offset (+09:00) 포함
        assert '+09:00' in result or '+0900' in result

    def test_correct_kst_time_in_iso(self):
        utc_dt = datetime(2025, 7, 15, 0, 0, 0, tzinfo=timezone.utc)
        result = get_kst_isoformat(utc_dt)
        assert '09:00:00' in result


class TestGetKstTimestamp:
    """get_kst_timestamp() 분기 테스트"""

    def test_returns_float(self):
        result = get_kst_timestamp()
        assert isinstance(result, float)

    def test_is_recent_epoch(self):
        """2025년 이후 epoch이어야 함"""
        result = get_kst_timestamp()
        # 2025-01-01 00:00:00 UTC = 1735689600
        assert result > 1735689600


class TestGetKstDateString:
    """get_kst_date_string() 분기 테스트"""

    def test_returns_string(self):
        result = get_kst_date_string()
        assert isinstance(result, str)

    def test_format_yyyy_mm_dd(self):
        result = get_kst_date_string()
        parts = result.split('-')
        assert len(parts) == 3
        assert len(parts[0]) == 4  # YYYY
        assert len(parts[1]) == 2  # MM
        assert len(parts[2]) == 2  # DD


class TestGetKstDatetimeString:
    """get_kst_datetime_string() 분기 테스트"""

    def test_returns_string(self):
        result = get_kst_datetime_string()
        assert isinstance(result, str)

    def test_format_yyyy_mm_dd_hh_mm_ss(self):
        result = get_kst_datetime_string()
        date_part, time_part = result.split(' ')
        assert len(date_part.split('-')) == 3
        assert len(time_part.split(':')) == 3
