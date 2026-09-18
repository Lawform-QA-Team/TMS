/**
 * KT-CS CLM 정상 유저 플로우 부하 테스트 (steady-state / 실사용 근사 시나리오)
 * ----------------------------------------------------------------
 * clm-load-test.js가 "최악의 시나리오"(매 iteration마다 재로그인 + think time 1~3초로
 * VU가 논스톱으로 API를 두들기는 구조)라면, 이 스크립트는 실제 사용자 행동에 가깝게
 * 아래 3가지를 다르게 가져간다:
 *
 *   1. VU(= 시뮬레이션되는 유저 1명)당 로그인은 딱 1번만 하고, 이후 iteration에서는
 *      캐싱해둔 토큰을 세션 내내 재사용한다 (매번 재로그인하지 않음).
 *   2. 요청이 401을 받으면(세션 만료로 추정) 그때만 캐시를 비우고 재로그인 — 실제
 *      세션 만료 상황을 흉내낸다.
 *   3. think time을 훨씬 길게 잡는다 — 같은 방문(iteration) 안의 화면 전환 사이는
 *      ACTION_THINK_TIME(기본 5~15초), 한 번의 방문을 마치고 다음 방문까지는
 *      SESSION_IDLE_TIME(기본 30~90초)로 실제 업무 중 텀을 흉내낸다.
 *      (⚠️ 실제 사용 로그/애널리틱스로 검증된 값이 아니라 임시 가정값입니다.
 *      실측 데이터가 있으면 아래 환경변수로 조정하세요.)
 *
 * 시나리오 구성(read_flow 80% / write_flow 20%, 계정 풀 분리 방식)은
 * clm-load-test.js와 동일 — "동시 접속자 수" 자체는 같게 유지하고, 그 안에서
 * 각 유저가 어떻게 행동하는지만 실제에 가깝게 바꾼 버전이다.
 *
 * 인증: requireServiceAuth_Business — x-access-token 헤더
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=https://alpha.api.lfdev.io \
 *     -e ACCOUNTS_CSV=./data/accounts.csv \
 *     -e PEAK_VUS=9500 \
 *     test-scripts/performance/KT-CS/clm-normal-flow-test.js
 *
 * 스모크 실행:
 *   k6 run -e BASE_URL=... -e PEAK_VUS=10 clm-normal-flow-test.js
 *
 * think time 커스터마이즈:
 *   -e ACTION_THINK_MIN=5 -e ACTION_THINK_MAX=15 -e IDLE_THINK_MIN=30 -e IDLE_THINK_MAX=90
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
const CLM_ID = __ENV.CLM_ID || '284089'; // clm-load-test.js와 동일한 ID 재사용 (TODO: 계정별 ID가 더 현실적일 수 있음)

// read : write = 4 : 1 비율로 VU 분배 (clm-load-test.js와 동일)
const READ_VUS = Math.round(PEAK_VUS * 0.8);
const WRITE_VUS = Math.round(PEAK_VUS * 0.2);

// 같은 방문(iteration) 안, 화면 전환 사이의 think time — "다음 화면 보기 전 잠깐 생각"
const ACTION_THINK_TIME = [
  Number(__ENV.ACTION_THINK_MIN || 5),
  Number(__ENV.ACTION_THINK_MAX || 15),
];
// 한 번의 방문(iteration)을 마치고, 같은 유저가 다시 뭔가를 하기까지의 텀
// — "업무 중 이 화면을 다시 열기까지 쉬는 시간". clm-load-test.js의 1~3초보다 훨씬 길게 잡음.
const SESSION_IDLE_TIME = [
  Number(__ENV.IDLE_THINK_MIN || 30),
  Number(__ENV.IDLE_THINK_MAX || 90),
];

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
  if (!parsed.data.length) {
    throw new Error(
      `계정 CSV(${ACCOUNTS_CSV})가 비어있습니다. email,password 헤더로 준비해주세요.`
    );
  }
  return parsed.data;
});

// read_flow / write_flow가 같은 계정으로 동시에 로그인하면 세션·토큰이 서로
// 무효화될 수 있어, 위 VU 분배(read:write = 4:1)와 동일한 비율로 계정 풀도 분리한다.
//
// ⚠️ accounts.slice(...)로 실제 배열을 만들면 안 됨 — k6 SharedArray는 인덱스 하나
// (accounts[idx])에 접근할 때만 그 원소 하나를 파싱/freeze 하도록 설계되어 저렴하지만,
// .slice(0, N)은 내부적으로 N개 인덱스를 전부 Get()해서 파싱한다. 이 코드는 스크립트
// top-level이라 VU 초기화마다 실행되므로, VU가 많을 땐 .slice()가 메모리 고갈을 일으킨다
// (clm-load-test.js에서 실제로 "cannot allocate memory" 크래시로 확인됨).
// → 배열을 나누지 말고, 인덱스 범위만 계산해서 accounts[idx] 하나만 건드리게 한다.
const READ_ACCOUNTS_SPLIT = Math.min(
  accounts.length - 1,
  Math.max(1, Math.round(accounts.length * 0.8))
);
const READ_POOL_SIZE = READ_ACCOUNTS_SPLIT || accounts.length;
const WRITE_POOL_SIZE = (accounts.length - READ_ACCOUNTS_SPLIT) || accounts.length;
const WRITE_POOL_OFFSET = accounts.length - READ_ACCOUNTS_SPLIT > 0 ? READ_ACCOUNTS_SPLIT : 0;

// ------------------------------------------------------------------
// 커스텀 메트릭
// ------------------------------------------------------------------
const loginDuration = new Trend('kt_clm_normal_login_duration', true);
const listDuration = new Trend('kt_clm_normal_list_duration', true);
const createDuration = new Trend('kt_clm_normal_create_duration', true);
const updateDuration = new Trend('kt_clm_normal_update_duration', true);
const detailDuration = new Trend('kt_clm_normal_detail_duration', true);

const readFlowSuccessRate = new Rate('kt_clm_normal_read_flow_success');
const writeFlowSuccessRate = new Rate('kt_clm_normal_write_flow_success');
const flowErrors = new Counter('kt_clm_normal_flow_errors');

// handleSummary용 에러 로그 (VU 간 공유 안 됨 — 정확한 집계는 flowErrors 사용)
const scriptErrors = [];

// ------------------------------------------------------------------
// k6 옵션
// ------------------------------------------------------------------
export const options = {
  // L7 스위치가 커넥션 단위로 로드밸런싱하는데, k6 기본 keep-alive 커넥션 재사용 때문에
  // 하나의 커넥션이 붙은 백엔드로 요청이 계속 몰리는 문제 방지 → 매 요청마다 새 커넥션 생성
  noConnectionReuse: true,
  noVUConnectionReuse: true,
  insecureSkipTLSVerify: true,
  scenarios: {
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
    kt_clm_normal_read_flow_success: ['rate>0.99'],
    kt_clm_normal_write_flow_success: ['rate>0.99'],
    // SLA 임시 기준 — 실제 목표 응답시간 확정 후 조정 필요
    'group_duration{group:::01_clm_list}': ['p(95)<2000'],
    'group_duration{group:::01_clm_create}': ['p(95)<5000'],
    'group_duration{group:::02_clm_update}': ['p(95)<3000'],
    'group_duration{group:::03_clm_detail}': ['p(95)<2000'],
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
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36 k6-clm-normal-flow-test',
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

function logError(label, account, extra) {
  scriptErrors.push({
    message: `[${label}][VU${__VU}] ${account?.email ?? '(계정 미배정)'}${extra ? ' ' + extra : ''}`,
    time: new Date().toISOString(),
  });
}

// ------------------------------------------------------------------
// VU-scope 세션 캐시 — read_flow VU와 write_flow VU는 서로 다른 exec 함수로
// 실행되므로(한 VU는 둘 중 하나만 계속 실행) 이 하나의 변수로 충분하다.
// k6는 VU마다 독립된 JS 실행 컨텍스트를 쓰기 때문에, 모듈 top-level에 선언한
// 변수는 자연스럽게 "이 VU 전용" 상태가 되어 iteration을 넘어 값이 유지된다.
// ------------------------------------------------------------------
const session = { account: null, token: null };

// 최초 iteration에서만 로그인하고, 이후에는 캐시된 토큰을 재사용한다.
// 401을 받아 session.token이 비워진 경우(세션 만료로 추정)에도 여기서 재로그인한다.
function ensureSession(poolOffset, poolSize, flowLabel) {
  if (session.token) return true;

  let ok = true;
  group(`00_login_${flowLabel}`, function () {
    // VU ID로 계정을 고정 배정 — "이 VU = 이 계정으로 로그인한 유저 1명"을 세션 내내 유지
    const idx = poolOffset + (exec.vu.idInTest % poolSize);
    const account = accounts[idx];
    const token = login(account);
    if (!token) {
      ok = false;
      flowErrors.add(1, { step: 'login', flow: flowLabel });
      logError(`${flowLabel}/login`, account, 'token=null');
    } else {
      session.account = account;
      session.token = token;
    }
  });
  return ok;
}

// ------------------------------------------------------------------
// 시나리오 1: 읽기 플로우 (read_flow) — 로그인된 유저가 주기적으로 CLM 상세를 확인
// ------------------------------------------------------------------
export function readFlow() {
  if (!ensureSession(0, READ_POOL_SIZE, 'read')) {
    readFlowSuccessRate.add(false);
    // 로그인 실패 시 바로 재시도하면 폭주하니, 다음 시도 전까지 쉰다
    sleep(randomBetween(...SESSION_IDLE_TIME));
    return;
  }

  const account = session.account;
  let ok = true;

  sleep(randomBetween(...ACTION_THINK_TIME)); // 화면 열기 전 잠깐 대기

  group('01_clm_list', function () {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/v3/clms/${CLM_ID}`,
      authedParams(session.token, 'GET /api/v3/clms/:id')
    );
    listDuration.add(Date.now() - start);

    if (res.status === 401) session.token = null; // 세션 만료 추정 → 다음 iteration에 재로그인

    const success = check(res, { 'CLM 상세 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_list', flow: 'read' });
      logError('read/clm_list', account, res.status);
    }
  });

  readFlowSuccessRate.add(ok);
  // 이번 방문을 마치고, 다음에 다시 이 화면을 열어볼 때까지 쉬는 시간
  sleep(randomBetween(...SESSION_IDLE_TIME));
}

// ------------------------------------------------------------------
// 시나리오 2: 생성/수정 플로우 (write_flow) — 로그인된 유저가 주기적으로 CLM을 작성
// ------------------------------------------------------------------
export function writeFlow() {
  if (!ensureSession(WRITE_POOL_OFFSET, WRITE_POOL_SIZE, 'write')) {
    writeFlowSuccessRate.add(false);
    sleep(randomBetween(...SESSION_IDLE_TIME));
    return;
  }

  const account = session.account;
  let ok = true;
  let clmId = null;

  sleep(randomBetween(...ACTION_THINK_TIME));

  // CLM 생성 (body 없음 — 서버가 세션(x-access-token)에서 user_id / team_id 추출)
  group('01_clm_create', function () {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v3/clms/plain`,
      '{}',
      authedParams(session.token, 'POST /api/v3/clms/plain')
    );
    createDuration.add(Date.now() - start);

    if (res.status === 401) session.token = null;

    const success = check(res, { 'CLM 생성 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_create', flow: 'write' });
      logError('write/clm_create', account, res.status);
    } else {
      try {
        clmId = res.json()?.id || null;
      } catch (_) {}
    }
  });

  if (!ok || !clmId) {
    writeFlowSuccessRate.add(false);
    sleep(randomBetween(...SESSION_IDLE_TIME));
    return;
  }
  sleep(randomBetween(...ACTION_THINK_TIME));

  // CLM 임시저장 (단순 수정, 상태 전이 없음)
  group('02_clm_update', function () {
    const payload = JSON.stringify({
      name: `정상플로우테스트_VU${__VU}_${Date.now()}`,
      clmPayments: [],
    });
    const start = Date.now();
    const res = http.put(
      `${BASE_URL}/api/v3/clms/${clmId}/update/draft`,
      payload,
      authedParams(session.token, 'PUT /api/v3/clms/:id/update/draft')
    );
    updateDuration.add(Date.now() - start);

    if (res.status === 401) session.token = null;

    const success = check(res, { 'CLM 임시저장 200': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_update', flow: 'write' });
      logError('write/clm_update', account, `${res.status} clm_id=${clmId}`);
    }
  });

  if (!ok) {
    writeFlowSuccessRate.add(false);
    sleep(randomBetween(...SESSION_IDLE_TIME));
    return;
  }
  sleep(randomBetween(...ACTION_THINK_TIME));

  // 생성된 CLM 상세 조회 (저장 결과 확인)
  group('03_clm_detail', function () {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/v3/clms/${clmId}`,
      authedParams(session.token, 'GET /api/v3/clms/:id')
    );
    detailDuration.add(Date.now() - start);

    if (res.status === 401) session.token = null;

    const success = check(res, {
      'CLM 상세 200': (r) => r.status === 200,
      'CLM id 일치': (r) => {
        try {
          return r.json()?.id === clmId;
        } catch (_) {
          return false;
        }
      },
    });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'clm_detail', flow: 'write' });
      logError('write/clm_detail', account, `${res.status} clm_id=${clmId}`);
    }
  });

  writeFlowSuccessRate.add(ok);
  // 이번 작성 작업을 마치고, 다음에 또 CLM을 작성/수정할 때까지 쉬는 시간
  sleep(randomBetween(...SESSION_IDLE_TIME));
}

// ------------------------------------------------------------------
// 결과 출력 — HTML/JSON 리포트 + Slack 요약/에러 스레드
// ------------------------------------------------------------------
export function handleSummary(data) {
  const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
  const token = __ENV.SLACK_BOT_TOKEN;
  const channel = __ENV.SLACK_CHANNEL_ID;

  if (token && channel) {
    const payload = buildK6SummaryMessage(data, 'KT-CS CLM Normal Flow', scriptErrors.length > 0);
    const ts = postSlackMessage(token, channel, payload);
    if (ts && scriptErrors.length > 0) {
      postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
    }
  }

  return {
    [`Result/kt_cs_clm_normal_flow_${timestamp}.html`]: htmlReport(data),
    [`Result/kt_cs_clm_normal_flow_${timestamp}.json`]: JSON.stringify(data, null, 2),
  };
}
