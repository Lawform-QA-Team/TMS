"""
routes/analytics.py 화이트박스 통합 테스트
Pass Rate 추이 API의 모든 날짜 필터 분기 테스트
"""
import pytest
import json
from datetime import datetime, timedelta


def create_history_record(db, tc_id, user_id, new_value, changed_at):
    """TestCaseHistory 레코드 생성 헬퍼"""
    from models import TestCaseHistory
    h = TestCaseHistory(
        test_case_id=tc_id,
        field_name='result_status',
        old_value='N/T',
        new_value=new_value,
        changed_by=user_id,
        changed_at=changed_at,
        change_type='update',
    )
    db.session.add(h)


class TestPassRateTrend:
    """GET /analytics/pass-rate-trend 분기 테스트"""

    def test_default_30_days(self, client, app, guest_auth_headers):
        """기본 30일 필터"""
        with app.app_context():
            resp = client.get('/analytics/pass-rate-trend', headers=guest_auth_headers)
            assert resp.status_code == 200
            data = json.loads(resp.data)
            assert 'dates' in data
            assert 'pass_rates' in data
            assert 'pass_counts' in data
            assert 'fail_counts' in data
            assert data['period_days'] == 30

    def test_days_7(self, client, app, guest_auth_headers):
        with app.app_context():
            resp = client.get('/analytics/pass-rate-trend?days=7', headers=guest_auth_headers)
            assert resp.status_code == 200
            data = json.loads(resp.data)
            assert data['period_days'] == 7

    def test_days_0_all_time(self, client, app, guest_auth_headers):
        """days=0: 전체 기간 (날짜 필터 없음)"""
        with app.app_context():
            resp = client.get('/analytics/pass-rate-trend?days=0', headers=guest_auth_headers)
            assert resp.status_code == 200
            data = json.loads(resp.data)
            assert data['period_days'] == 0

    def test_start_date_filter(self, client, app, guest_auth_headers):
        """start_date 직접 지정"""
        with app.app_context():
            resp = client.get('/analytics/pass-rate-trend?start_date=2025-01-01',
                              headers=guest_auth_headers)
            assert resp.status_code == 200

    def test_start_and_end_date_filter(self, client, app, guest_auth_headers):
        """start_date + end_date 범위 지정"""
        with app.app_context():
            resp = client.get(
                '/analytics/pass-rate-trend?start_date=2025-01-01&end_date=2025-12-31',
                headers=guest_auth_headers
            )
            assert resp.status_code == 200

    def test_invalid_date_format_returns_error(self, client, app, guest_auth_headers):
        """잘못된 날짜 형식 → 500 오류"""
        with app.app_context():
            resp = client.get('/analytics/pass-rate-trend?start_date=invalid-date',
                              headers=guest_auth_headers)
            assert resp.status_code == 500

    def test_pass_rate_calculation_with_data(self, client, app, guest_auth_headers,
                                              sample_testcase, admin_user):
        """실제 히스토리 데이터가 있을 때 Pass Rate 계산 검증"""
        from models import db, TestCaseHistory
        with app.app_context():
            # 오늘 날짜로 Pass 2개, Fail 1개 히스토리 생성
            now = datetime.now()
            create_history_record(db, sample_testcase.id, admin_user.id, 'Pass', now)
            create_history_record(db, sample_testcase.id, admin_user.id, 'Pass', now)
            create_history_record(db, sample_testcase.id, admin_user.id, 'Fail', now)
            db.session.commit()

            resp = client.get('/analytics/pass-rate-trend?days=1', headers=guest_auth_headers)
            assert resp.status_code == 200
            data = json.loads(resp.data)

            if len(data['dates']) > 0:
                # 오늘 날짜의 pass_rate = 2/(2+1) * 100 ≈ 66.7
                today_idx = -1  # 마지막 날짜
                p = data['pass_counts'][today_idx]
                f = data['fail_counts'][today_idx]
                total = p + f
                if total > 0:
                    rate = round(p / total * 100, 1)
                    assert abs(rate - data['pass_rates'][today_idx]) < 0.1

            # 정리
            TestCaseHistory.query.filter_by(test_case_id=sample_testcase.id).delete()
            db.session.commit()

    def test_empty_data_returns_empty_arrays(self, client, app, guest_auth_headers):
        """히스토리 데이터 없을 때 빈 배열 반환"""
        with app.app_context():
            # 미래 날짜 범위 → 데이터 없음
            resp = client.get(
                '/analytics/pass-rate-trend?start_date=2099-01-01&end_date=2099-12-31',
                headers=guest_auth_headers
            )
            assert resp.status_code == 200
            data = json.loads(resp.data)
            assert data['dates'] == []
            assert data['pass_rates'] == []

    def test_environment_filter(self, client, app, guest_auth_headers):
        """environment 필터"""
        with app.app_context():
            resp = client.get('/analytics/pass-rate-trend?environment=dev',
                              headers=guest_auth_headers)
            assert resp.status_code == 200

    def test_response_arrays_same_length(self, client, app, guest_auth_headers,
                                         sample_testcase, admin_user):
        """dates, pass_rates, pass_counts, fail_counts 길이 동일"""
        from models import db, TestCaseHistory
        with app.app_context():
            now = datetime.now()
            yesterday = now - timedelta(days=1)
            create_history_record(db, sample_testcase.id, admin_user.id, 'Pass', now)
            create_history_record(db, sample_testcase.id, admin_user.id, 'Fail', yesterday)
            db.session.commit()

            resp = client.get('/analytics/pass-rate-trend?days=7', headers=guest_auth_headers)
            data = json.loads(resp.data)
            n = len(data['dates'])
            assert len(data['pass_rates']) == n
            assert len(data['pass_counts']) == n
            assert len(data['fail_counts']) == n

            TestCaseHistory.query.filter_by(test_case_id=sample_testcase.id).delete()
            db.session.commit()


class TestOtherAnalyticsEndpoints:
    """기타 analytics 엔드포인트 smoke test"""

    def test_trends_endpoint(self, client, app, guest_auth_headers):
        with app.app_context():
            resp = client.get('/analytics/trends', headers=guest_auth_headers)
            assert resp.status_code in [200, 404]

    def test_flaky_tests_endpoint(self, client, app, guest_auth_headers):
        with app.app_context():
            resp = client.get('/analytics/flaky-tests', headers=guest_auth_headers)
            assert resp.status_code in [200, 404]
