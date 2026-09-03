/**
 * KT-CS CLM(계약 관리) 서버 과부하 테스트
 * ----------------------------------------------------------------
 * 시나리오 구성 (2개 executor, 동시 실행):
 *
 *   [read_flow]  — 전체 VU의 80%
 *     1. POST /api/login/email          — 로그인
 *     2. GET  /api/clm/                 — CLM 목록 조회
 *     3. GET  /api/clm/counts           — CLM 진행 현황
 *     4. GET  /api/clm/review_status    — 대시보드 통계
 *
 *   [write_flow] — 전체 VU의 20%
 *     1. POST /api/login/email          — 로그인
 *     2. POST /api/clm/create/plain     — CLM 생성
 *     3. GET  /api/clm/:id              — 생성된 CLM 상세 조회
 *
 * 인증: requireServiceAuth_Business — x-access-token 헤더
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=https://alpha.api.lfdev.io \
 *     -e ACCOUNTS_CSV=./data/accounts.csv \
 *     -e PEAK_VUS=9500 \
 *     test-scripts/performance/KT-CS/clm-load-test.js
 *
 * 스모크 실행:
 *   k6 run -e BASE_URL=... -e PEAK_VUS=10 clm-load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { getFormattedTimestamp } from './Utils.js';
import {
  postSlackMessage,
  buildK6SummaryMessage,
  buildK6ErrorThreadBlocks,
} from './kt-cs-sleck-helper.js';

// ------------------------------------------------------------------
// 설정
// ------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ACCOUNTS_CSV = __ENV.ACCOUNTS_CSV || './data/accounts.csv';
const PEAK_VUS = Number(__ENV.PEAK_VUS || 9500);

// read : write = 4 : 1 비율로 VU 분배
const READ_VUS  = Math.round(PEAK_VUS * 0.8);
const WRITE_VUS = Math.round(PEAK_VUS * 0.2);

const THINK_TIME = [1, 3]; // 단계 사이 think time (초) [min, max]

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// ------------------------------------------------------------------
// 테스트 데이터
// CSV 헤더: email,password
// ------------------------------------------------------------------
const accounts = new SharedArray('accounts', function () {
  const csv = open(ACCOUNTS_CSV);
  const parsed = papaparse.parse(csv, { header: true, skipEmptyLines: true });
  if (!parsed.data.length) {
    throw new Error(
      `계정 CSV(${ACCOUNTS_CSV})가 비어있습니다. email,password 헤더로 준비해주세요.`
    );
  }
  return parsed.data;
});

// ------------------------------------------------------------------
// 커스텀 메트릭
// ------------------------------------------------------------------
const loginDuration        = new Trend('kt_clm_login_duration', true);
const listDuration         = new Trend('kt_clm_list_duration', true);
const countsDuration       = new Trend('kt_clm_counts_duration', true);
const reviewStatusDuration = new Trend('kt_clm_review_status_duration', true);
const createDuration       = new Trend('kt_clm_create_duration', true);
const updateDuration       = new Trend('kt_clm_update_duration', true);
const detailDuration       = new Trend('kt_clm_detail_duration', true);

const readFlowSuccessRate  = new Rate('kt_clm_read_flow_success');
const writeFlowSuccessRate = new Rate('kt_clm_write_flow_success');
const flowErrors           = new Counter('kt_clm_flow_errors');

// handleSummary용 에러 로그 (VU 간 공유 안 됨 — 정확한 집계는 flowErrors 사용)
const scriptErrors = [];

// ------------------------------------------------------------------
// k6 옵션
// ------------------------------------------------------------------
export const options = {
  scenarios: {
    // 조회 중심 트래픽 (80%)
    read_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: Math.min(100,  READ_VUS) },
        { duration: '2m', target: Math.min(1000, READ_VUS) },
        { duration: '2m', target: Math.min(3000, READ_VUS) },
        { duration: '3m', target: READ_VUS },
        { duration: '5m', target: READ_VUS }, // 피크 유지
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'readFlow',
    },
    // 생성/수정 트래픽 (20%)
    write_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: Math.min(20,  WRITE_VUS) },
        { duration: '2m', target: Math.min(200, WRITE_VUS) },
        { duration: '2m', target: Math.min(600, WRITE_VUS) },
        { duration: '3m', target: WRITE_VUS },
        { duration: '5m', target: WRITE_VUS },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'writeFlow',
    },
  },
  thresholds: {
    checks: ['rate>=0.95'],
    http_req_failed: ['rate<0.01'],
    kt_clm_read_flow_success:  ['rate>0.99'],
    kt_clm_write_flow_success: ['rate>0.99'],
    // SLA 임시 기준 — 실제 목표 응답시간 확정 후 조정 필요
    'group_duration{group:::01_login_read}':    ['p(95)<3000'],
    'group_duration{group:::02_clm_list}':      ['p(95)<2000'],
    'group_duration{group:::03_clm_counts}':    ['p(95)<2000'],
    'group_duration{group:::04_review_status}': ['p(95)<2000'],
    'group_duration{group:::01_login_write}':   ['p(95)<3000'],
    'group_duration{group:::02_clm_create}':    ['p(95)<5000'],
    'group_duration{group:::03_clm_update}':    ['p(95)<3000'],
    'group_duration{group:::04_clm_detail}':    ['p(95)<2000'],
  },
};

// ------------------------------------------------------------------
// 헬퍼: 로그인 → x-access-token 반환
// ------------------------------------------------------------------
function login(account) {
  const payload = JSON.stringify({
    email: account.email,
    password: account.password,
    is_mobile: 2,
    browser_name: 'Chrome',
    user_agent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36 k6-clm-load-test',
    is_gld: false,
    attemptCount: 1,
    auth_result: true,
  });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/login/email`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /api/login/email' },
  });
  loginDuration.add(Date.now() - start);

  const ok = check(res, { '로그인 200': (r) => r.status === 200 });
  if (!ok) return null;

  try {
    const body = res.json();
    return body?.data?.token || body?.token || null;
  } catch (_) {
    return null;
  }
}

function authedParams(token, tag) {
  return {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    tags: { name: tag },
  };
}

function logError(scriptErrors, label, account, status, extra) {
  scriptErrors.push({
    message: `[${label}][VU${__VU}] ${account.email} status=${status}${extra ? ' ' + extra : ''}`,
    time: new Date().toISOString(),
  });
}

// ------------------------------------------------------------------
// 시나리오 1: 읽기 플로우 (read_flow)
// ------------------------------------------------------------------
export function readFlow() {
  const idx = exec.scenario.iterationInTest % accounts.length;
  const account = accounts[idx];
  let ok = true;
  let token = null;

  // 1. 로그인
  group('01_login_read', function () {
    token = login(account);
    if (!token) {
      ok = false;
      flowErrors.add(1, { step: 'login', flow: 'read' });
      logError(scriptErrors, 'read/login', account, 'token=null', null);
    }
  });

  if (!ok) { readFlowSuccessRate.add(false); return; }
  sleep(randomBetween(...THINK_TIME));

  // 2. CLM 목록 조회
  group('02_clm_list', function () {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/clm/`,
      authedParams(token, 'GET /api/clm/')
    );
    listDuration.add(Date.now() - start);

    const success = check(res, { 'CLM 목록 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_list', flow: 'read' });
      logError(scriptErrors, 'read/clm_list', account, res.status, null);
    }
  });

  if (!ok) { readFlowSuccessRate.add(false); return; }
  sleep(randomBetween(...THINK_TIME));

  // 3. CLM 진행 현황 (대시보드 배지 카운트)
  group('03_clm_counts', function () {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/clm/counts`,
      authedParams(token, 'GET /api/clm/counts')
    );
    countsDuration.add(Date.now() - start);

    const success = check(res, { 'CLM counts 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_counts', flow: 'read' });
      logError(scriptErrors, 'read/clm_counts', account, res.status, null);
    }
  });

  if (!ok) { readFlowSuccessRate.add(false); return; }
  sleep(randomBetween(...THINK_TIME));

  // 4. 대시보드 통계 (검토 진행 현황)
  group('04_review_status', function () {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/clm/review_status`,
      authedParams(token, 'GET /api/clm/review_status')
    );
    reviewStatusDuration.add(Date.now() - start);

    const success = check(res, { 'CLM review_status 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'review_status', flow: 'read' });
      logError(scriptErrors, 'read/review_status', account, res.status, null);
    }
  });

  readFlowSuccessRate.add(ok);
}

// ------------------------------------------------------------------
// 시나리오 2: 생성/수정/삭제 플로우 (write_flow)
// ------------------------------------------------------------------
export function writeFlow() {
  const idx = exec.scenario.iterationInTest % accounts.length;
  const account = accounts[idx];
  let ok = true;
  let token = null;
  let clmId = null;

  // 1. 로그인
  group('01_login_write', function () {
    token = login(account);
    if (!token) {
      ok = false;
      flowErrors.add(1, { step: 'login', flow: 'write' });
      logError(scriptErrors, 'write/login', account, 'token=null', null);
    }
  });

  if (!ok) { writeFlowSuccessRate.add(false); return; }
  sleep(randomBetween(...THINK_TIME));

  // 2. CLM 생성 (POST /api/clm/create/plain)
  // body 없음 — 서버가 세션(x-access-token)에서 user_id / team_id 추출
  group('02_clm_create', function () {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/clm/create/plain`,
      '{}',
      authedParams(token, 'POST /api/clm/create/plain')
    );
    createDuration.add(Date.now() - start);

    const success = check(res, { 'CLM 생성 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_create', flow: 'write' });
      logError(scriptErrors, 'write/clm_create', account, res.status, res.body?.slice(0, 200));
    } else {
      try {
        clmId = res.json()?.data?.id || null;
      } catch (_) {}
    }
  });

  if (!ok || !clmId) { writeFlowSuccessRate.add(false); return; }
  sleep(randomBetween(...THINK_TIME));

  // 3. CLM 임시저장 (PUT /api/clm/update/draft — 단순 수정, 상태 전이 없음)
  // is_update_progress 없이 name + clm_payments만 전달 → cfs 없는 신규 CLM도 에러 없이 처리됨
  group('03_clm_update', function () {
    const payload = JSON.stringify({
      name: `부하테스트_VU${__VU}_${Date.now()}`,
      clm_payments: [],
    });
    const start = Date.now();
    const res = http.put(
      `${BASE_URL}/api/v3/clms/${clmId}/update/draft`,
      payload,
      authedParams(token, 'PUT /api/v3/clms/:id/update/draft')
    );
    updateDuration.add(Date.now() - start);

    const success = check(res, { 'CLM 임시저장 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_update', flow: 'write' });
      logError(scriptErrors, 'write/clm_update', account, res.status, `clm_id=${clmId}`);
    }
  });

  if (!ok) { writeFlowSuccessRate.add(false); return; }
  sleep(randomBetween(...THINK_TIME));

  // 4. 생성된 CLM 상세 조회
  group('04_clm_detail', function () {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/clm/${clmId}`,
      authedParams(token, 'GET /api/clm/:id')
    );
    detailDuration.add(Date.now() - start);

    const success = check(res, {
      'CLM 상세 200': (r) => r.status === 200,
      'CLM id 일치': (r) => {
        try { return r.json()?.data?.id === clmId; } catch (_) { return false; }
      },
    });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_detail', flow: 'write' });
      logError(scriptErrors, 'write/clm_detail', account, res.status, `clm_id=${clmId}`);
    }
  });

  writeFlowSuccessRate.add(ok);
}

// ------------------------------------------------------------------
// 결과 출력 — HTML/JSON 리포트 + Slack 요약/에러 스레드
// ------------------------------------------------------------------
export function handleSummary(data) {
  const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
  const token = __ENV.SLACK_BOT_TOKEN;
  const channel = __ENV.SLACK_CHANNEL_ID;

  if (token && channel) {
    const payload = buildK6SummaryMessage(data, 'KT-CS CLM Flow', scriptErrors.length > 0);
    const ts = postSlackMessage(token, channel, payload);
    if (ts && scriptErrors.length > 0) {
      postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
    }
  }

  return {
    [`Result/kt_cs_clm_flow_${timestamp}.html`]: htmlReport(data),
    [`Result/kt_cs_clm_flow_${timestamp}.json`]: JSON.stringify(data, null, 2),
  };
}
