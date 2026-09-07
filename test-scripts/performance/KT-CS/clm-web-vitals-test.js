/**
 * KT-CS 로그인 → CLM 목록/상세 화면 Web Vitals(RUM) 측정 — k6 browser 모듈
 * ----------------------------------------------------------------
 * ⚠️⚠️ 필독 — protocol 테스트(clm-load-test.js 등)와 리소스 요구량이 완전히 다릅니다 ⚠️⚠️
 *
 *   FCP/LCP/CLS/FID/INP 같은 지표는 "화면이 실제로 그려지는 시점"을 재는 값이라
 *   k6/http로는 측정이 불가능하고, k6/browser로 VU마다 실제 Chromium 프로세스를
 *   띄워서 페이지를 열어야만 얻을 수 있습니다.
 *
 *   즉 VU 1개 = 실제 브라우저 프로세스 1개(대략 CPU 1코어 + 메모리 수백MB 이상).
 *   PEAK_VUS=1000을 로컬 PC/서버 한 대에서 그대로 돌리면 거의 확실히 CPU/메모리
 *   포화로 브라우저가 죽거나 응답이 왜곡되어 측정 자체가 무의미해집니다.
 *   (k6 공식 가이드도 브라우저 테스트는 동시 세션 수를 수십 단위로 유지하고,
 *   그 이상은 여러 대의 로드 제너레이터로 분산 실행하라고 권고합니다.)
 *
 *   → 반드시 아래 "파일럿 실행"으로 먼저 리소스 사용량(CPU/메모리)을 확인한 뒤,
 *     필요하면 로드 제너레이터를 여러 대로 나눠서 스케일업하세요.
 *     PEAK_VUS=1000 그대로 단일 머신에서 돌리는 걸 권장하지 않습니다.
 *
 * 시나리오 (VU당 순차 실행):
 *   1. 로그인 페이지 접속 → 폼 입력 → 로그인 (01_login)
 *   2. CLM 목록 페이지 접속 (02_clm_list)
 *   3. CLM 상세 페이지 접속 (03_clm_detail)
 *
 * Web Vitals(FCP/TTFB/LCP/FID/INP/CLS)는 k6 browser 모듈이 페이지 이동마다
 * 자동으로 browser_web_vital_* 메트릭으로 수집합니다 — 별도 계측 코드 불필요.
 * (k6 v0.52+ 필요. 로컬 PC에 Chrome/Chromium이 설치되어 있어야 하며,
 * 경로를 못 찾으면 K6_BROWSER_EXECUTABLE_PATH 환경변수로 지정)
 *
 * ⚠️ 확인 필요 (실행 전 반드시 개발팀/프론트엔드 확인) ⚠️
 *   - 로그인 폼 input/button의 실제 selector (name, id 등) — 아래 SELECTORS는 가정값
 *   - 로그인 성공을 판별할 화면 요소(selector) — 아래는 URL 변경으로만 가정 판별
 *   - CLM 목록/상세 페이지의 실제 프론트엔드 경로 — 아래 CLM_LIST_PATH,
 *     CLM_DETAIL_PATH는 API 스크립트(clm-load-test.js)의 CLM_ID(284089)를
 *     재사용한 가정값
 *
 * 파일럿 실행 (먼저 이걸로 리소스 사용량부터 확인):
 *   k6 run \
 *     -e FRONTEND_BASE_URL=http://10.1.2.17 \
 *     -e ACCOUNTS_CSV=./data/accounts.csv \
 *     -e PEAK_VUS=10 \
 *     test-scripts/performance/KT-CS/clm-web-vitals-test.js
 *
 * 본 실행 (요청 규모 — 위 경고 참고, 단일 머신에서 그대로 돌리지 말 것):
 *   k6 run \
 *     -e FRONTEND_BASE_URL=http://10.1.2.17 \
 *     -e ACCOUNTS_CSV=./data/accounts.csv \
 *     -e PEAK_VUS=1000 \
 *     test-scripts/performance/KT-CS/clm-web-vitals-test.js
 */

import { browser } from 'k6/browser';
import { check, group, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
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
const FRONTEND_BASE_URL = __ENV.FRONTEND_BASE_URL || 'http://10.1.2.17';
const LOGIN_PATH = __ENV.LOGIN_PATH || '/login';
// TODO: 실제 CLM 목록/상세 프론트엔드 경로 확인 필요 (아래는 가정값)
const CLM_LIST_PATH = __ENV.CLM_LIST_PATH || '/clms';
const CLM_ID = __ENV.CLM_ID || '284089'; // clm-load-test.js와 동일한 ID 재사용
const CLM_DETAIL_PATH = __ENV.CLM_DETAIL_PATH || `/clms/${CLM_ID}`;
const ACCOUNTS_CSV = __ENV.ACCOUNTS_CSV || './data/accounts.csv';

// ⚠️ 위 파일 상단 경고 참고 — 1,000은 사용자 요청값을 기본으로 반영한 것일 뿐,
// 단일 머신에서 그대로 실행하는 걸 권장하지 않음. 파일럿(PEAK_VUS=10~20)부터 시작할 것.
const PEAK_VUS = Number(__ENV.PEAK_VUS || 1000);

const THINK_TIME = [1, 3]; // 단계 사이 think time (초) [min, max]

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// TODO: 실제 로그인 폼 selector로 교체 필요 (프론트엔드 개발팀 확인)
const SELECTORS = {
  email: 'input[name="email"]',
  password: 'input[name="password"]',
  submit: 'button[type="submit"]',
};

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

// ------------------------------------------------------------------
// 커스텀 메트릭
// ------------------------------------------------------------------
const flowSuccessRate = new Rate('kt_clm_web_vitals_flow_success');
const flowErrors = new Counter('kt_clm_web_vitals_flow_errors');

// handleSummary용 에러 로그 (VU 간 공유 안 됨 — 정확한 집계는 flowErrors 사용)
const scriptErrors = [];

// ------------------------------------------------------------------
// k6 옵션
// ------------------------------------------------------------------
export const options = {
  scenarios: {
    web_vitals: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: Math.min(10, PEAK_VUS) },
        { duration: '2m', target: Math.min(50, PEAK_VUS) },
        { duration: '3m', target: PEAK_VUS },
        { duration: '5m', target: PEAK_VUS }, // 피크 유지
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate>=0.95'],
    kt_clm_web_vitals_flow_success: ['rate>0.99'],
    // Core Web Vitals "Good" 기준 참고한 임시값 — 실제 SLA 확정 후 조정 필요
    browser_web_vital_ttfb: ['p(95)<800'],
    browser_web_vital_fcp: ['p(95)<1800'],
    browser_web_vital_lcp: ['p(95)<2500'],
    browser_web_vital_cls: ['p(95)<0.1'],
    // FID는 구글이 INP로 대체 권고 중이지만 요청대로 유지 — 신규 브라우저는 값이 안 잡힐 수 있음
    browser_web_vital_fid: ['p(95)<100'],
    browser_web_vital_inp: ['p(95)<200'],
    'group_duration{group:::01_login}': ['p(95)<5000'],
    'group_duration{group:::02_clm_list}': ['p(95)<3000'],
    'group_duration{group:::03_clm_detail}': ['p(95)<3000'],
  },
};

function logError(label, account, extra) {
  scriptErrors.push({
    message: `[${label}][VU${__VU}] ${account.email}${extra ? ' ' + extra : ''}`,
    time: new Date().toISOString(),
  });
}

// ------------------------------------------------------------------
// 메인 시나리오
// ------------------------------------------------------------------
export default async function () {
  const idx = exec.scenario.iterationInTest % accounts.length;
  const account = accounts[idx];

  const context = await browser.newContext();
  const page = await context.newPage();
  let ok = true;

  try {
    // 1. 로그인 --------------------------------------------------
    await group('01_login', async function () {
      await page.goto(`${FRONTEND_BASE_URL}${LOGIN_PATH}`, { waitUntil: 'load' });

      await page.locator(SELECTORS.email).fill(account.email);
      await page.locator(SELECTORS.password).fill(account.password);

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.locator(SELECTORS.submit).click(),
      ]);

      // TODO: 실제 로그인 성공 판별 조건으로 교체 필요 — 지금은 로그인 페이지에서
      // 벗어났는지(URL 변경)만으로 가정 판별
      const success = check(page, {
        '로그인 페이지 이탈': (p) => !p.url().includes(LOGIN_PATH),
      });
      if (!success) {
        ok = false;
        flowErrors.add(1, { step: 'login' });
        logError('login', account, `url=${page.url()}`);
      }
    });

    if (!ok) return;
    sleep(randomBetween(...THINK_TIME));

    // 2. CLM 목록 --------------------------------------------------
    await group('02_clm_list', async function () {
      const res = await page.goto(`${FRONTEND_BASE_URL}${CLM_LIST_PATH}`, {
        waitUntil: 'load',
      });
      const success = check(res, { 'CLM 목록 정상 응답': (r) => r.status() === 200 });
      if (!success) {
        ok = false;
        flowErrors.add(1, { step: 'clm_list' });
        logError('clm_list', account, `status=${res.status()}`);
      }
    });

    if (!ok) return;
    sleep(randomBetween(...THINK_TIME));

    // 3. CLM 상세 --------------------------------------------------
    await group('03_clm_detail', async function () {
      const res = await page.goto(`${FRONTEND_BASE_URL}${CLM_DETAIL_PATH}`, {
        waitUntil: 'load',
      });
      const success = check(res, { 'CLM 상세 정상 응답': (r) => r.status() === 200 });
      if (!success) {
        ok = false;
        flowErrors.add(1, { step: 'clm_detail' });
        logError('clm_detail', account, `status=${res.status()}`);
      }
    });

    sleep(randomBetween(...THINK_TIME));
  } finally {
    // 컨텍스트를 안 닫으면 VU마다 브라우저 리소스가 누적되어 장시간 실행 시 메모리 누수로 이어짐
    await page.close();
    await context.close();
  }

  flowSuccessRate.add(ok);
}

// ------------------------------------------------------------------
// 결과 출력 — HTML/JSON 리포트 + Slack 요약/에러 스레드
// ------------------------------------------------------------------
export function handleSummary(data) {
  const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
  const token = __ENV.SLACK_BOT_TOKEN;
  const channel = __ENV.SLACK_CHANNEL_ID;

  if (token && channel) {
    const payload = buildK6SummaryMessage(data, 'KT-CS CLM Web Vitals', scriptErrors.length > 0);
    const ts = postSlackMessage(token, channel, payload);
    if (ts && scriptErrors.length > 0) {
      postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
    }
  }

  return {
    [`Result/kt_cs_clm_web_vitals_${timestamp}.html`]: htmlReport(data),
    [`Result/kt_cs_clm_web_vitals_${timestamp}.json`]: JSON.stringify(data, null, 2),
  };
}
