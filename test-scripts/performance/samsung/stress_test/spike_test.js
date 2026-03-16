import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { URLS } from '../real/url_base_sam.js';
import { getFormattedTimestamp } from '../../common/utils.js';
import { sendSlackWebhook, buildK6SummaryMessage } from '../../common/slack_helper.js';

// ── 커스텀 메트릭 ──────────────────────────────────────────
const successRate   = new Rate('success_rate');
const requestTrend  = new Trend('request_duration', true);
const failedCounter = new Counter('failed_requests');

// ── 스파이크 테스트 시나리오 ───────────────────────────────
//   - 평상시 낮은 부하 → 급격한 트래픽 폭증 → 정상 복귀 확인
//   - 대상 API 결정 후 TODO 항목 채울 것
export const options = {
    stages: [
        // 1단계: 정상 트래픽으로 ramp-up (시스템 워밍업)
        { duration: '1m',  target: 10  },
        // 2단계: 정상 부하 유지 (baseline 측정)
        { duration: '2m',  target: 10  },
        // 3단계: 급격한 스파이크 발생 (10 → 100 VU)
        { duration: '30s', target: 100 },
        // 4단계: 스파이크 부하 유지
        { duration: '1m',  target: 100 },
        // 5단계: 급격한 스파이크 해소 (100 → 10 VU)
        { duration: '30s', target: 10  },
        // 6단계: 회복 구간 확인 (정상 복귀 여부 검증)
        { duration: '2m',  target: 10  },
        // 7단계: ramp-down
        { duration: '30s', target: 0   },
    ],

    // ── 임계값 ───────────────────────────────────────────────
    thresholds: {
        // 응답 시간: 정상 구간 기준
        http_req_duration: [
            'p(95)<2000',  // 95th percentile 2초 미만
            'p(99)<5000',  // 99th percentile 5초 미만 (스파이크 구간 감안)
        ],
        // 오류율: 스파이크 포함 전체 1% 미만
        http_req_failed:  ['rate<0.01'],
        // 커스텀 성공률: 99% 이상 유지
        success_rate:     ['rate>0.99'],
        // 커스텀 응답 시간 트렌드
        request_duration: ['p(90)<1500'],
    },
};

/**
 * k6 환경변수에서 로그인 계정 반환
 * admin 테스트: -e ADMIN_LOGIN_EMAIL=... -e ADMIN_LOGIN_PASSWORD=...
 * web 테스트:   -e WEB_LOGIN_EMAIL=...   -e WEB_LOGIN_PASSWORD=...
 */
function getCredentials() {
    const email =
        (typeof __ENV !== 'undefined' &&
            (__ENV.ADMIN_LOGIN_EMAIL || __ENV.WEB_LOGIN_EMAIL || __ENV.LOGIN_EMAIL || __ENV.EMAIL)) || '';
    const password =
        (typeof __ENV !== 'undefined' &&
            (__ENV.ADMIN_LOGIN_PASSWORD || __ENV.WEB_LOGIN_PASSWORD || __ENV.LOGIN_PASSWORD || __ENV.PASSWORD)) || '';
    if (!email || !password) {
        throw new Error(
            '로그인 계정 필요. k6 실행 시 -e ADMIN_LOGIN_EMAIL=... -e ADMIN_LOGIN_PASSWORD=... 스크립트경로'
        );
    }
    console.log('EMAIL:', email);
    console.log('PASSWORD:', password);
    return { EMAIL: email, PASSWORD: password };
}

/**
 * setup(): 테스트 시작 전 1회 실행 — 인증 토큰/쿠키 획득
 * TODO: 대상 API의 실제 로그인 엔드포인트 및 요청/응답 구조에 맞게 수정
 */
export function setup() {
    const credentials = getCredentials();

    // TODO: 실제 로그인 API 엔드포인트 및 payload 구조로 교체
    // const loginUrl = URLS.LOGIN.LOGIN;
    // const res = http.post(loginUrl, JSON.stringify({
    //     email:    credentials.EMAIL,
    //     password: credentials.PASSWORD,
    // }), { headers: { 'Content-Type': 'application/json' } });
    // check(res, { 'login 200': (r) => r.status === 200 });
    // const body = res.json();
    // return { token: body?.token || body?.accessToken || '' };

    // 임시 반환 (TODO 완료 전까지 사용)
    return { token: '' };
}

// ── 메인 VU 로직 ──────────────────────────────────────────
export default function (data) {
    // TODO: 스파이크 대상 API 엔드포인트로 교체
    // const url = `${URLS.BASE}/api/v1/target-endpoint`;
    const url = URLS.BASE;

    const params = {
        headers: {
            'Content-Type':  'application/json',
            'Accept':        'application/json',
            // TODO: 인증 방식에 맞게 수정 (Bearer token / Cookie 등)
            // 'Authorization': `Bearer ${data.token}`,
        },
        timeout: '10s',
        tags:    { endpoint: url }, // Grafana 필터링용 태그
    };

    const res = http.get(url, params);

    // 커스텀 메트릭 기록
    requestTrend.add(res.timings.duration);

    // 응답 검증
    // TODO: 대상 API에 맞는 체크 조건으로 수정
    const passed = check(res, {
        'status 200'            : (r) => r.status === 200,
        'response time < 3000ms': (r) => r.timings.duration < 3000,
        'body not empty'        : (r) => r.body && r.body.length > 0,
        'content-type is json'  : (r) =>
            r.headers['Content-Type']?.includes('application/json'),
    });

    successRate.add(passed);
    if (!passed) {
        failedCounter.add(1);
        console.error(
            `[FAIL] status=${res.status} duration=${res.timings.duration}ms ` +
            `url=${url} body=${res.body?.substring(0, 200)}`
        );
    }

    // VU 간 간격 (스파이크 효과를 명확히 하기 위해 짧게 설정)
    sleep(1);
}

// ── 테스트 결과 요약 ──────────────────────────────────────
export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');

    const slackWebhookUrl = typeof __ENV !== 'undefined' ? __ENV.SLACK_WEBHOOK_URL : '';
    if (slackWebhookUrl) {
        const payload = buildK6SummaryMessage(data, 'Spike Test');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/spike_test_${timestamp}.html`]: htmlReport(data),
    };
}
