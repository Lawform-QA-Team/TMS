/**
 * KT-CS 전자서명(Esign) 부하 테스트
 * ----------------------------------------------------------------
 * 시나리오 구성 (2개 executor, 동시 실행):
 *
 *   [read_flow]  — 전체 VU의 80%
 *     1. POST /api/login/email                  — 로그인
 *     2. GET  /api/v2/esign/                    — 전자서명 목록 조회
 *     3. GET  /api/v2/esign/pending/signer/     — 본인 서명 대기 목록
 *     4. GET  /api/v2/esign/statistics          — 통계 조회
 *
 *   [write_flow] — 전체 VU의 20%
 *     1. POST /api/login/email                  — 로그인
 *     2. POST /api/v2/esign/                    — 전자서명 생성
 *     3. GET  /api/v2/esign/:id                 — 생성된 건 단건 조회
 *     4. POST /api/v2/esign/register/complete   — 최종 전송 등록 완료
 *
 * ⚠️  확인 필요 / 가정 사항 (실행 전 개발팀 확인)
 *   - POST /api/v2/esign/ 의 정확한 request body는 확인 필요.
 *     아래 buildEsignPayload()의 필드는 일반적인 전자서명 생성 필드로 가정.
 *   - POST /api/v2/esign/register/complete 의 request body 확인 필요.
 *   - 서명자 정보, 서명 위치 등 실제 데이터는 테스트 계정에 맞게 조정 필요.
 *   - accounts CSV 컬럼: email,password
 *     (전자서명 생성 테스트 시 서명자 email도 CSV에 포함 권장:
 *      email,password,signer_email,signer_name)
 *
 * 실행 예시:
 *   k6 run \
 *     -e BASE_URL=https://alpha.api.lfdev.io \
 *     -e ACCOUNTS_CSV=./data/accounts.csv \
 *     -e PEAK_VUS=9500 \
 *     test-scripts/performance/KT-CS/esign-load-test.js
 *
 * 스모크(환경 확인) 실행:
 *   k6 run -e BASE_URL=... -e PEAK_VUS=10 esign-load-test.js
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
const PROGRESS_STATUS = Number(__ENV.PROGRESS_STATUS || 200);

// read : write = 4 : 1 비율로 VU 분배
const READ_VUS = Math.round(PEAK_VUS * 0.8);
const WRITE_VUS = Math.round(PEAK_VUS * 0.2);

const THINK_TIME = [1, 3]; // 단계 사이 think time (초) [min, max]

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// ------------------------------------------------------------------
// 테스트 데이터
// CSV 헤더: email,password[,signer_email,signer_name,clm_id]
//   clm_id: CLM 연동 전자서명 테스트 시에만 포함 (없으면 생략)
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
const loginDuration        = new Trend('kt_esign_login_duration', true);
const listDuration         = new Trend('kt_esign_list_duration', true);
const pendingListDuration  = new Trend('kt_esign_pending_list_duration', true);
const statisticsDuration   = new Trend('kt_esign_statistics_duration', true);
const createDuration       = new Trend('kt_esign_create_duration', true);
const detailDuration       = new Trend('kt_esign_detail_duration', true);
const registerDuration     = new Trend('kt_esign_register_duration', true);

const readFlowSuccessRate  = new Rate('kt_esign_read_flow_success');
const writeFlowSuccessRate = new Rate('kt_esign_write_flow_success');
const flowErrors           = new Counter('kt_esign_flow_errors');

// handleSummary용 에러 로그 (VU 간 공유 안 됨 — 예시성 로그, 정확한 집계는 flowErrors 사용)
const scriptErrors = [];

// ------------------------------------------------------------------
// k6 옵션 — 두 executor 동시 실행
// ------------------------------------------------------------------
export const options = {
  scenarios: {
    // 조회 중심 트래픽 (80%)
    read_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: Math.min(100, READ_VUS) },
        { duration: '2m', target: Math.min(1000, READ_VUS) },
        { duration: '2m', target: Math.min(3000, READ_VUS) },
        { duration: '3m', target: READ_VUS },
        { duration: '5m', target: READ_VUS }, // 피크 유지
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'readFlow',
    },
    // 생성/전송 트래픽 (20%)
    write_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: Math.min(20, WRITE_VUS) },
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
    kt_esign_read_flow_success:  ['rate>0.99'],
    kt_esign_write_flow_success: ['rate>0.99'],
    // SLA 임시 기준 — 실제 목표 응답시간 확정 후 조정 필요
    'group_duration{group:::01_login_read}':   ['p(95)<3000'],
    'group_duration{group:::02_esign_list}':   ['p(95)<2000'],
    'group_duration{group:::03_pending_list}': ['p(95)<2000'],
    'group_duration{group:::04_statistics}':   ['p(95)<2000'],
    'group_duration{group:::01_login_write}':  ['p(95)<3000'],
    'group_duration{group:::02_esign_create}': ['p(95)<5000'],
    'group_duration{group:::03_esign_detail}': ['p(95)<2000'],
    'group_duration{group:::04_register}':     ['p(95)<5000'],
  },
};

// ------------------------------------------------------------------
// 헬퍼: 로그인 → x-access-token 반환
// ------------------------------------------------------------------
function login(account) {
  const payload = JSON.stringify({
    email: account.email,
    password: account.password,
    is_mobile: 2,         // 2: PC (데스크톱)
    browser_name: 'Chrome',
    user_agent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36 k6-esign-load-test',
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
    return (
      body?.token ||
      body?.accessToken ||
      body?.access_token ||
      body?.data?.token ||
      body?.data?.accessToken ||
      null
    );
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

// ------------------------------------------------------------------
// 전자서명 생성 payload 빌더
// ⚠️ 실제 API 스펙 확인 후 필드 수정 필요
// ------------------------------------------------------------------
function buildEsignPayload(account) {
  return JSON.stringify({
    title: `k6-load-test-${Date.now()}`,
    // 서명자 목록 — CSV에 signer_email, signer_name이 있으면 실제 값 사용
    signers: [
      {
        name: account.signer_name || 'k6-tester',
        email: account.signer_email || account.email,
        order: 1,
      },
    ],
    // TODO: 실제 전자서명 생성에 필요한 추가 필드 확인 후 보완
    // (예: template_id, deadline, is_sequential 등)
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
      scriptErrors.push({
        message: `[read][VU${__VU}] login failed (${account.email})`,
        time: new Date().toISOString(),
      });
    }
  });

  if (!ok) {
    readFlowSuccessRate.add(false);
    return;
  }

  sleep(randomBetween(...THINK_TIME));

  // 2. 전자서명 목록 조회
  group('02_esign_list', function () {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v2/esign/`, authedParams(token, 'GET /api/v2/esign/'));
    listDuration.add(Date.now() - start);

    const success = check(res, { 'esign 목록 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'esign_list', flow: 'read' });
      scriptErrors.push({
        message: `[read][VU${__VU}] esign list failed (${account.email}): ${res.status}`,
        time: new Date().toISOString(),
      });
    }
  });

  if (!ok) {
    readFlowSuccessRate.add(false);
    return;
  }

  sleep(randomBetween(...THINK_TIME));

  // 3. 본인 서명 대기 목록
  group('03_pending_list', function () {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/v2/esign/pending/signer/?progress_status=${PROGRESS_STATUS}&page=0&limit=10&is_completed=2`,
      authedParams(token, 'GET /api/v2/esign/pending/signer/')
    );
    pendingListDuration.add(Date.now() - start);

    const success = check(res, { 'pending signer 목록 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'pending_list', flow: 'read' });
      scriptErrors.push({
        message: `[read][VU${__VU}] pending list failed (${account.email}): ${res.status}`,
        time: new Date().toISOString(),
      });
    }
  });

  if (!ok) {
    readFlowSuccessRate.add(false);
    return;
  }

  sleep(randomBetween(...THINK_TIME));

  // 4. 통계 조회
  group('04_statistics', function () {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/v2/esign/statistics`,
      authedParams(token, 'GET /api/v2/esign/statistics')
    );
    statisticsDuration.add(Date.now() - start);

    const success = check(res, { 'esign 통계 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'statistics', flow: 'read' });
      scriptErrors.push({
        message: `[read][VU${__VU}] statistics failed (${account.email}): ${res.status}`,
        time: new Date().toISOString(),
      });
    }
  });

  readFlowSuccessRate.add(ok);
}

// ------------------------------------------------------------------
// 시나리오 2: 생성/전송 플로우 (write_flow)
// ------------------------------------------------------------------
export function writeFlow() {
  const idx = exec.scenario.iterationInTest % accounts.length;
  const account = accounts[idx];
  let ok = true;
  let token = null;
  let esignId = null;

  // 1. 로그인
  group('01_login_write', function () {
    token = login(account);
    if (!token) {
      ok = false;
      flowErrors.add(1, { step: 'login', flow: 'write' });
      scriptErrors.push({
        message: `[write][VU${__VU}] login failed (${account.email})`,
        time: new Date().toISOString(),
      });
    }
  });

  if (!ok) {
    writeFlowSuccessRate.add(false);
    return;
  }

  sleep(randomBetween(...THINK_TIME));

  // 2. 전자서명 생성
  group('02_esign_create', function () {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v2/esign/`,
      buildEsignPayload(account),
      authedParams(token, 'POST /api/v2/esign/')
    );
    createDuration.add(Date.now() - start);

    const success = check(res, { 'esign 생성 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'esign_create', flow: 'write' });
      scriptErrors.push({
        message: `[write][VU${__VU}] esign create failed (${account.email}): ${res.status} ${res.body?.slice(0, 200)}`,
        time: new Date().toISOString(),
      });
    } else {
      try {
        esignId = res.json()?.data?.id || null;
      } catch (_) {}
    }
  });

  if (!ok || !esignId) {
    writeFlowSuccessRate.add(false);
    return;
  }

  sleep(randomBetween(...THINK_TIME));

  // 3. 생성된 전자서명 단건 조회
  group('03_esign_detail', function () {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/v2/esign/${esignId}`,
      authedParams(token, 'GET /api/v2/esign/:id')
    );
    detailDuration.add(Date.now() - start);

    const success = check(res, {
      'esign 단건 조회 200': (r) => r.status === 200,
      'esign id 일치': (r) => {
        try {
          return r.json()?.data?.id === esignId;
        } catch (_) {
          return false;
        }
      },
    });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'esign_detail', flow: 'write' });
      scriptErrors.push({
        message: `[write][VU${__VU}] esign detail failed (id=${esignId}): ${res.status}`,
        time: new Date().toISOString(),
      });
    }
  });

  if (!ok) {
    writeFlowSuccessRate.add(false);
    return;
  }

  sleep(randomBetween(...THINK_TIME));

  // 4. 최종 전송 등록 완료
  // progress_status → USER_SIGNING(200), 서명 참여자 이메일/문자 발송
  // clm_id는 CLM 연동 시에만 포함 (CSV에 clm_id 컬럼 추가 후 account.clm_id 사용)
  group('04_register', function () {
    const body = { id: esignId };
    if (account.clm_id) body.clm_id = Number(account.clm_id);
    const payload = JSON.stringify(body);
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v2/esign/register/complete`,
      payload,
      authedParams(token, 'POST /api/v2/esign/register/complete')
    );
    registerDuration.add(Date.now() - start);

    const success = check(res, { 'register complete 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'register', flow: 'write' });
      scriptErrors.push({
        message: `[write][VU${__VU}] register complete failed (id=${esignId}): ${res.status}`,
        time: new Date().toISOString(),
      });
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
    const payload = buildK6SummaryMessage(data, 'KT-CS Esign Flow', scriptErrors.length > 0);
    const ts = postSlackMessage(token, channel, payload);
    if (ts && scriptErrors.length > 0) {
      postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
    }
  }

  return {
    [`Result/kt_cs_esign_flow_${timestamp}.html`]: htmlReport(data),
    [`Result/kt_cs_esign_flow_${timestamp}.json`]: JSON.stringify(data, null, 2),
  };
}
