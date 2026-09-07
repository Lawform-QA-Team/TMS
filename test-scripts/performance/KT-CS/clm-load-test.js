/**
 * KT-CS CLM(계약 관리) 서버 과부하 테스트
 * ----------------------------------------------------------------
 * 시나리오 구성 (2개 executor, 동시 실행):
 *
 *   [read_flow]  — 전체 VU의 80%
 *     1. POST /api/v3/login/email          — 로그인
 *     2. GET  /api/v3/clms/:id               — CLM 목록 조회
 *
 *   [write_flow] — 전체 VU의 20%
 *     1. POST /api/v3/login/email          — 로그인
 *     2. POST /api/v3/clms/plain           — CLM 생성
 *     3. PUT  /api/v3/clms/:id/update/draft — CLM 임시저장
 *     4. GET  /api/v3/clms/:id             — 생성된 CLM 상세 조회
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
  // Windows(Excel)에서 저장한 CSV는 UTF-8 BOM(﻿)이 앞에 붙어서 나오는데,
  // papaparse는 이걸 제거하지 않아 첫 헤더가 "﻿email"이 되어 account.email이 undefined가 됨 → 반드시 먼저 제거
  const csv = open(ACCOUNTS_CSV)
    .replace(/^﻿/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const parsed = papaparse.parse(csv, { header: true, skipEmptyLines: true });
  console.log(`[accounts] 총 ${parsed.data.length}개 계정 로드됨`);
  if (parsed.data.length > 0) {
    console.log(`[accounts] 첫 번째 행: ${JSON.stringify(parsed.data[0])}`);
    console.log(`[accounts] 두 번째 행: ${JSON.stringify(parsed.data[1])}`);
  }
  if (!parsed.data.length) {
    throw new Error(
      `계정 CSV(${ACCOUNTS_CSV})가 비어있습니다. email,password 헤더로 준비해주세요.`
    );
  }
  return parsed.data;
});

// read_flow / write_flow가 같은 계정으로 동시에 로그인하면 세션·토큰이 서로
// 무효화될 수 있어, 위 VU 분배(read:write = 4:1)와 동일한 비율로 계정 풀도 분리한다.
const READ_ACCOUNTS_SPLIT = Math.min(
  accounts.length - 1,
  Math.max(1, Math.round(accounts.length * 0.8))
);
let readAccounts = accounts.slice(0, READ_ACCOUNTS_SPLIT);
let writeAccounts = accounts.slice(READ_ACCOUNTS_SPLIT);
// 계정이 1~2건뿐인 스모크 테스트 등 극단적인 경우엔 분리하면 한쪽 풀이 비므로 폴백
if (!readAccounts.length) readAccounts = accounts;
if (!writeAccounts.length) writeAccounts = accounts;

// ------------------------------------------------------------------
// 커스텀 메트릭
// ------------------------------------------------------------------
const loginDuration        = new Trend('kt_clm_login_duration', true);
const listDuration         = new Trend('kt_clm_list_duration', true);
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
  const res = http.post(`${BASE_URL}/api/v3/login/email`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /api/v3/login/email' },
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
  const idx = exec.scenario.iterationInTest % readAccounts.length;
  const account = readAccounts[idx];
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

  // 2. CLM 상세 조회
  group('02_clm_list', function () {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/v3/clms/284089`,
      authedParams(token, 'GET /api/v3/clms/:id')
    );
    listDuration.add(Date.now() - start);

    const success = check(res, { 'CLM 상세 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_list', flow: 'read' });
      logError(scriptErrors, 'read/clm_list', account, res.status, null);
    }
  });

  if (!ok) { readFlowSuccessRate.add(false); return; }
  sleep(randomBetween(...THINK_TIME));

  readFlowSuccessRate.add(ok);
}

// ------------------------------------------------------------------
// 시나리오 2: 생성/수정/삭제 플로우 (write_flow)
// ------------------------------------------------------------------
export function writeFlow() {
  const idx = exec.scenario.iterationInTest % writeAccounts.length;
  const account = writeAccounts[idx];
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

  // 2. CLM 생성 (POST /api/v3/clms/plain)
  // body 없음 — 서버가 세션(x-access-token)에서 user_id / team_id 추출
  group('02_clm_create', function () {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v3/clms/plain`,
      '{}',
      authedParams(token, 'POST /api/v3/clms/plain')
    );
    createDuration.add(Date.now() - start);

    const success = check(res, { 'CLM 생성 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_create', flow: 'write' });
      logError(scriptErrors, 'write/clm_create', account, res.status, res.body?.slice(0, 200));
    } else {
      try {
        clmId = res.json()?.id || null;
      } catch (_) {}
    }
  });

  if (!ok || !clmId) { writeFlowSuccessRate.add(false); return; }
  sleep(randomBetween(...THINK_TIME));

  // 3. CLM 임시저장 (PUT /api/v3/clms/:id/update/draft — 단순 수정, 상태 전이 없음)
  // is_update_progress 없이 name + clmPayments만 전달 → cfs 없는 신규 CLM도 에러 없이 처리됨
  group('03_clm_update', function () {
    const payload = JSON.stringify({
      name: `부하테스트_VU${__VU}_${Date.now()}`,
      clmPayments: [],
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
      `${BASE_URL}/api/v3/clms/${clmId}`,
      authedParams(token, 'GET /api/v3/clms/:id')
    );
    detailDuration.add(Date.now() - start);

    const success = check(res, {
      'CLM 상세 200': (r) => r.status === 200,
      'CLM id 일치': (r) => {
        try { return r.json()?.id === clmId; } catch (_) { return false; }
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
