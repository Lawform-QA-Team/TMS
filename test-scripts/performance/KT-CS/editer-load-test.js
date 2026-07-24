/**
 * KT-CS 로그인 → 편집기(Polaris) 부하 테스트
 * ------------------------------------------------------------
 * 시나리오 (단일 흐름, VU당 순차 실행):
 *   1. POST /api/login/email                       — 로그인 (DB 쿼리 5~8회 병목)
 *   2. POST /api/polaris/cfs/get                    — 편집기 데이터 로드
 *   3. PUT  /api/polaris/cfs/update/editmode (Y)     — 편집 모드 진입
 *   4. PUT  /api/polaris/cfs/save                    — 저장 (multipart)
 *   5. PUT  /api/polaris/cfs/update/editmode (N)     — 편집 모드 종료 → S3 복사 병목
 *
 * ⚠️ 확인 필요 / 가정 사항 (실행 전 반드시 개발팀 확인)
 *   - 로그인 인증 방식: 세션 쿠키 vs Bearer 토큰 — 아래 extractAuth()가 둘 다
 *     시도하도록 만들어 두었으나, 실제 응답 필드명은 개발팀 확인 후 수정 필요.
 *   - is_mobile: 1|2 중 어떤 값이 데스크톱/모바일인지 미확인 → 기본 2(데스크톱) 가정.
 *   - is_gld, auth_result, attemptCount 필드의 정확한 의미/기대값 미확인 →
 *     아래 DEFAULT_LOGIN_FIELDS에서 가정값 사용. 실제 로그인 실패 시
 *     이 값들부터 의심할 것.
 *   - /api/polaris/cfs/get, /update/editmode, /save 의 정확한 요청 필드명은
 *     "cfsId" 하나만 확인됨. 그 외 필드는 실제 프론트 요청을 캡처해 보완 필요.
 *   - cfs/save의 multipart 파일 필드명은 "file"로 가정 (미확인).
 *
 * 실행 예시:
 *   k6 run \
 *     -e BASE_URL=https://staging.kt-cs.example.com \
 *     -e ACCOUNTS_CSV=./data/accounts.csv \
 *     -e CFS_ID=1001 \
 *     -e SAMPLE_FILE=./data/sample.pdf \
 *     kt-cs-editor-load-test.js
 *
 * 소규모 파일럿(스모크) 실행:
 *   k6 run -e BASE_URL=... -e MAX_VUS=50 -e PEAK_VUS=50 kt-cs-editor-load-test.js
 *
 * 결과 출력 (삼성전자 프로젝트 스크립트 스타일과 통일):
 *   - handleSummary에서 Result/kt_cs_editor_flow_<timestamp>.html / .json 생성
 *   - SLACK_BOT_TOKEN, SLACK_CHANNEL_ID 환경변수가 있으면 요약 메시지를 슬랙으로
 *     발송하고, 에러가 있으면 같은 스레드에 상세 내역을 이어서 보낸다.
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { getFormattedTimestamp } from './common/utils.js';
import {
  postSlackMessage,
  buildK6SummaryMessage,
  buildK6ErrorThreadBlocks,
} from './common/slack_helper.js';

// ------------------------------------------------------------------
// 설정 (환경변수로 오버라이드)
// ------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ACCOUNTS_CSV = __ENV.ACCOUNTS_CSV || './data/accounts.csv';
const SAMPLE_FILE_PATH = __ENV.SAMPLE_FILE || './data/sample.pdf';
const DEFAULT_CFS_ID = __ENV.CFS_ID || '1001';

// 문서에서 합의된 목표 동접(9,500명 = KT-CS 임직원 수). 파일럿 시 -e PEAK_VUS=100 등으로 축소.
const PEAK_VUS = Number(__ENV.PEAK_VUS || 9500);

// 각 단계 사이 think time (실사용자 흉내). 초 단위 [min, max].
const THINK_TIME = [1, 3];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// ------------------------------------------------------------------
// 테스트 데이터 로드
// ------------------------------------------------------------------
// SharedArray: 모든 VU가 메모리를 공유해서 읽음 (9,500건이라도 VU별 중복 로드 방지)
const accounts = new SharedArray('accounts', function () {
  const csv = open(ACCOUNTS_CSV);
  const parsed = papaparse.parse(csv, { header: true, skipEmptyLines: true });
  if (!parsed.data.length) {
    throw new Error(
      `계정 CSV(${ACCOUNTS_CSV})가 비어있습니다. email,password[,cfs_id] 헤더로 준비해주세요.`
    );
  }
  return parsed.data;
});

// 편집기 저장(cfs/save)에 쓸 샘플 파일. 실제 pdf/docx/hwp로 교체 권장.
const sampleFile = open(SAMPLE_FILE_PATH, 'b');

// ------------------------------------------------------------------
// 커스텀 메트릭 — 단계별 병목 추적용
// ------------------------------------------------------------------
const loginDuration = new Trend('kt_login_duration', true);
const cfsGetDuration = new Trend('kt_cfs_get_duration', true);
const editModeEnterDuration = new Trend('kt_editmode_enter_duration', true);
const cfsSaveDuration = new Trend('kt_cfs_save_duration', true);
const editModeExitDuration = new Trend('kt_editmode_exit_duration', true); // S3 복사 병목 구간
const flowSuccessRate = new Rate('kt_flow_success_rate');
const flowErrors = new Counter('kt_flow_errors');

// handleSummary에서 슬랙 에러 스레드로 보낼 상세 로그.
// ⚠️ k6는 VU마다 별도 JS 컨텍스트를 쓰므로 이 배열은 VU 간 공유되지 않는다.
// (삼성전자 스크립트와 동일한 한계) 정확한 전체 실패 건수는 kt_flow_errors
// Counter(모든 VU에서 자동 집계됨)로 확인할 것 — 이 배열은 "예시성 상세 로그" 용도.
const scriptErrors = [];

// ------------------------------------------------------------------
// k6 옵션 — 단계적 램프업 (100 → 500 → 1,000 → 3,000 → 9,500), 회의록 실행계획 기준
// ------------------------------------------------------------------
export const options = {
  scenarios: {
    login_to_editor_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: Math.min(100, PEAK_VUS) },
        { duration: '2m', target: Math.min(500, PEAK_VUS) },
        { duration: '2m', target: Math.min(1000, PEAK_VUS) },
        { duration: '3m', target: Math.min(3000, PEAK_VUS) },
        { duration: '3m', target: PEAK_VUS },
        { duration: '5m', target: PEAK_VUS }, // 피크 유지 — 5단계 전체 흐름이 다 돌 시간 확보
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    checks: ['rate>=0.95'],
    http_req_failed: ['rate<0.01'],
    kt_flow_success_rate: ['rate>0.99'],
    // SLA 확정 전 임시 기준값 — 실제 목표 응답시간 확정되면 조정 필요
    'group_duration{group:::01_login}': ['p(95)<3000'],
    'group_duration{group:::02_cfs_get}': ['p(95)<2000'],
    'group_duration{group:::03_editmode_enter}': ['p(95)<2000'],
    'group_duration{group:::04_cfs_save}': ['p(95)<5000'],
    // editmode 종료(S3 복사)는 별도로 느슨하게 — 병목 지점이라 우선 관찰 목적
    'group_duration{group:::05_editmode_exit}': ['p(95)<8000'],
  },
};

// ------------------------------------------------------------------
// 헬퍼: 로그인 응답에서 인증 정보 추출 (세션 쿠키 / Bearer 토�큰 둘 다 대응)
// ------------------------------------------------------------------
function extractAuthHeaders(loginRes) {
  // 세션 쿠키 방식이면 k6 VU 쿠키 저장소가 자동으로 이후 요청에 실어준다.
  // 토큰 방식일 가능성에 대비해 흔한 필드명들을 탐색한다. (실응답 확인 후 정리 필요)
  let token;
  try {
    const body = loginRes.json();
    token =
      body?.token ||
      body?.accessToken ||
      body?.access_token ||
      body?.data?.token ||
      body?.data?.accessToken;
  } catch (e) {
    // JSON이 아니거나 파싱 실패 — 세션 쿠키 방식으로 간주
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ------------------------------------------------------------------
// 메인 시나리오
// ------------------------------------------------------------------
export default function () {
  // iterationInTest: 전체 테스트 동안 단조 증가하는 전역 카운터 → 계정 순환 배분에 사용
  const idx = exec.scenario.iterationInTest % accounts.length;
  const account = accounts[idx];
  const cfsId = account.cfs_id || DEFAULT_CFS_ID;

  const commonParams = {
    headers: { 'Content-Type': 'application/json' },
    tags: { account: account.email, type: 'internal' },
  };
  let authHeaders = {};
  let ok = true;

  // 1. 로그인 -----------------------------------------------------
  group('01_login', function () {
    const payload = JSON.stringify({
      email: account.email,
      password: account.password,
      is_mobile: 2, // TODO: 1/2 중 데스크톱 값 확인 필요
      browser_name: 'Chrome',
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 k6-load-test',
      is_gld: false, // TODO: 필드 의미 확인 필요
      attemptCount: 1,
      auth_result: true, // TODO: 필드 의미 확인 필요
    });

    const loginStart = Date.now();
    const res = http.post(`${BASE_URL}/api/login/email`, payload, commonParams);
    const duration = Date.now() - loginStart;
    loginDuration.add(duration);
    console.log(`[VU${__VU}] login ${res.status} ${duration}ms`);

    const success = check(res, { '로그인 200 응답': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'login' });
      scriptErrors.push({
        message: `login failed [VU${__VU}] (${account.email}): ${res.status} ${res.body}`,
        time: new Date().toISOString(),
      });
    } else {
      authHeaders = extractAuthHeaders(res);
    }
  });

  if (!ok) {
    flowSuccessRate.add(false);
    return; // 로그인 실패 시 이후 단계 진행 무의미
  }

  sleep(randomBetween(...THINK_TIME));

  const authedParams = {
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    tags: { account: account.email, type: 'internal' },
  };

  // 2. 편집기 데이터 로드 ------------------------------------------
  group('02_cfs_get', function () {
    const payload = JSON.stringify({ cfsId });
    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/polaris/cfs/get`, payload, authedParams);
    const duration = Date.now() - start;
    cfsGetDuration.add(duration);
    console.log(`[VU${__VU}] cfs_get ${res.status} ${duration}ms`);

    const success = check(res, { 'cfs/get 200 응답': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'cfs_get' });
      scriptErrors.push({
        message: `cfs_get failed [VU${__VU}] (${account.email}): ${res.status} ${res.body}`,
        time: new Date().toISOString(),
      });
    }
  });

  if (!ok) {
    flowSuccessRate.add(false);
    return;
  }

  sleep(randomBetween(...THINK_TIME));

  // 3. 편집 모드 진입 (mode: 'Y') -----------------------------------
  group('03_editmode_enter', function () {
    const payload = JSON.stringify({ cfsId, mode: 'Y' });
    const start = Date.now();
    const res = http.put(
      `${BASE_URL}/api/polaris/cfs/update/editmode`,
      payload,
      authedParams
    );
    const duration = Date.now() - start;
    editModeEnterDuration.add(duration);
    console.log(`[VU${__VU}] editmode_enter ${res.status} ${duration}ms`);

    const success = check(res, { 'editmode(Y) 200 응답': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'editmode_enter' });
      scriptErrors.push({
        message: `editmode_enter failed [VU${__VU}] (${account.email}): ${res.status} ${res.body}`,
        time: new Date().toISOString(),
      });
    }
  });

  if (!ok) {
    flowSuccessRate.add(false);
    return;
  }

  // 편집 중 체류 시간 흉내 (실사용자는 훨씬 길게 머무름 — 테스트 목적상 단축)
  sleep(randomBetween(2, 5));

  // 4. 저장 (multipart) ---------------------------------------------
  group('04_cfs_save', function () {
    const payload = {
      cfsId: cfsId,
      file: http.file(sampleFile, 'load-test-sample.pdf', 'application/pdf'),
    };
    const start = Date.now();
    const res = http.put(`${BASE_URL}/api/polaris/cfs/save`, payload, {
      headers: { ...authHeaders }, // multipart Content-Type은 k6가 자동 설정
      tags: { account: account.email, type: 'internal' },
    });
    const duration = Date.now() - start;
    cfsSaveDuration.add(duration);
    console.log(`[VU${__VU}] cfs_save ${res.status} ${duration}ms`);

    const success = check(res, { 'cfs/save 200 응답': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'cfs_save' });
      scriptErrors.push({
        message: `cfs_save failed [VU${__VU}] (${account.email}): ${res.status} ${res.body}`,
        time: new Date().toISOString(),
      });
    }
  });

  if (!ok) {
    flowSuccessRate.add(false);
    return;
  }

  sleep(randomBetween(...THINK_TIME));

  // 5. 편집 모드 종료 (mode: 'N') — S3 복사 병목 구간 ------------------
  group('05_editmode_exit', function () {
    const payload = JSON.stringify({ cfsId, mode: 'N' });
    const start = Date.now();
    const res = http.put(
      `${BASE_URL}/api/polaris/cfs/update/editmode`,
      payload,
      authedParams
    );
    const duration = Date.now() - start;
    editModeExitDuration.add(duration);
    console.log(`[VU${__VU}] editmode_exit ${res.status} ${duration}ms`);

    const success = check(res, { 'editmode(N) 200 응답': (r) => r.status === 200 });
    if (!success) {
      ok = false;
      flowErrors.add(1, { step: 'editmode_exit' });
      scriptErrors.push({
        message: `editmode_exit failed [VU${__VU}] (${account.email}): ${res.status} ${res.body}`,
        time: new Date().toISOString(),
      });
    }
  });

  flowSuccessRate.add(ok);
}

// ------------------------------------------------------------------
// 결과 출력 — HTML/JSON 리포트 생성 + 슬랙 요약/에러 스레드 발송
// (삼성전자 프로젝트 web_qna_api 스크립트와 동일한 handleSummary 패턴)
// ------------------------------------------------------------------
export function handleSummary(data) {
  const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
  const token = __ENV.SLACK_BOT_TOKEN;
  const channel = __ENV.SLACK_CHANNEL_ID;

  if (token && channel) {
    const payload = buildK6SummaryMessage(data, 'KT-CS Editor Flow', scriptErrors.length > 0);
    const ts = postSlackMessage(token, channel, payload);
    if (ts && scriptErrors.length > 0) {
      postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
    }
  }

  return {
    [`Result/kt_cs_editor_flow_${timestamp}.html`]: htmlReport(data),
    [`Result/kt_cs_editor_flow_${timestamp}.json`]: JSON.stringify(data, null, 2),
  };
}