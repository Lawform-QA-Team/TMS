/**
 * KT-CS CLM 환경 최소 검증 (1인 / 1회)
 * ----------------------------------------------------------------
 * 부하 테스트 전에 대상 서버가 살아 있고, 계정으로 로그인 후
 * CLM 핵심 엔드포인트가 정상 응답하는지 확인한다.
 *
 * 검증 순서:
 *   1. POST /api/v3/login/email          — 로그인 & 토큰 확인
 *   2. GET  /api/v3/clms/                 — CLM 목록 조회
 *   5. POST /api/v3/clms/plain     — CLM 생성 & id 확인
 *   6. PUT  /api/v3/clms/{id}/update/draft     — 계약 검토 요청 (is_update_progress: true)
 *   7. GET  /api/v3/clms/:id              — 생성된 CLM 상세 조회
 *
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=https://alpha.api.lfdev.io \
 *     -e LOGIN_ID=user@example.com \
 *     -e LOGIN_PASSWORD=secret \
 *     test-scripts/performance/KT-CS/clm-env-check.js
 */

import http from 'k6/http';
import { check } from 'k6';

// ------------------------------------------------------------------
// BASE_URL 정규화 — 끝 슬래시 / /api 접미사 제거
// ------------------------------------------------------------------
function normalizeApiOrigin(raw) {
  let url = String(raw || 'http://localhost:3000').replace(/\/+$/, '');
  if (/\/api$/i.test(url)) {
    url = url.replace(/\/api$/i, '').replace(/\/+$/, '');
  }
  return url;
}

const RAW_BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const BASE_URL = normalizeApiOrigin(RAW_BASE_URL);
const LOGIN_ID = __ENV.LOGIN_ID || __ENV.EMAIL || __ENV.LOGIN_EMAIL || '';
const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || __ENV.PASSWORD || '';

// ------------------------------------------------------------------
// k6 옵션 — 1 VU, 1 iteration (환경 체크 전용)
// ------------------------------------------------------------------
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
  },
};

// ------------------------------------------------------------------
// setup: 환경변수 검증
// ------------------------------------------------------------------
export function setup() {
  if (!LOGIN_ID || !LOGIN_PASSWORD) {
    throw new Error(
      'LOGIN_ID(또는 EMAIL)와 LOGIN_PASSWORD(또는 PASSWORD) 환경변수가 필요합니다.'
    );
  }
  if (RAW_BASE_URL.replace(/\/+$/, '') !== BASE_URL) {
    console.log(`[env-check] BASE_URL 정규화: ${RAW_BASE_URL} → ${BASE_URL}`);
  }
  console.log(`[env-check] BASE_URL      = ${BASE_URL}`);
  console.log(`[env-check] LOGIN_ID      = ${LOGIN_ID}`);
  return { loginId: LOGIN_ID, loginPassword: LOGIN_PASSWORD };
}

// ------------------------------------------------------------------
// 메인
// ------------------------------------------------------------------
export default function (data) {
  const jsonHeaders = { 'Content-Type': 'application/json' };
  let token = null;
  let clmId = null;

  // ── 1. 로그인 ────────────────────────────────────────────────────
  console.log('[env-check] 1/7 로그인');
  {
    const payload = JSON.stringify({
      email: data.loginId,
      password: data.loginPassword,
      is_mobile: 2,
      browser_name: 'Chrome',
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/126.0 Safari/537.36 k6-clm-env-check',
      is_gld: false,
      attemptCount: 1,
      auth_result: true,
    });

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/v3/login/email`, payload, {
      headers: jsonHeaders,
      tags: { name: 'POST /api/v3/login/email' },
    });
    const duration = Date.now() - start;

    let tokenPresent = false;
    let bodyPreview = '';
    try {
      const body = res.json();
      token = body?.data?.token || body?.token || null;
      tokenPresent = !!token;
      bodyPreview = JSON.stringify(body).slice(0, 300);
    } catch (_) {
      bodyPreview = String(res.body || '').slice(0, 300);
    }

    const ok = check(res, {
      '1. 로그인 HTTP 200': (r) => r.status === 200,
      '1. 로그인 토큰 존재': () => tokenPresent,
    });

    console.log(
      `[env-check] login status=${res.status} duration=${duration}ms token=${tokenPresent} ok=${ok}`
    );
    if (!ok) {
      console.error(`[env-check] 응답 미리보기: ${bodyPreview}`);
      return; // 로그인 실패 시 이후 검증 의미 없음
    }
  }

  const authed = {
    headers: { 'Content-Type': 'application/json', 'x-access-token': token },
  };

 


  

  // ── 5. CLM 생성 ──────────────────────────────────────────────────
  console.log('[env-check] 5/7 CLM 생성');
  {
    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/v3/clms/plain`, '{}', {
      ...authed,
      tags: { name: 'POST /api/v3/clms/plain' },
    });
    const duration = Date.now() - start;

    let idPresent = false;
    let bodyPreview = '';
    try {
      const body = res.json();
      console.log(body)
      clmId = body.id || null;
      idPresent = !!clmId;
      bodyPreview = JSON.stringify(body).slice(0, 300);
    } catch (_) {
      bodyPreview = String(res.body || '').slice(0, 300);
    }

    const ok = check(res, {
      '5. CLM 생성 HTTP 200': (r) => r.status === 200,
      '5. CLM 생성 id 존재': () => idPresent,
    });

    console.log(
      `[env-check] clms/plain status=${res.status} duration=${duration}ms clm_id=${clmId} ok=${ok}`
    );
    if (!ok) {
      console.error(`[env-check] 응답 미리보기: ${bodyPreview}`);
      return;
    }
  }

  // ── 6. CLM 임시저장 ──────────────────────────────────────────────
  console.log(`[env-check] 6/7 CLM 임시저장 (id=${clmId})`);
  {
    const start = Date.now();
    const res = http.put(
      `${BASE_URL}/api/v3/clms/${clmId}/update/draft`,
      JSON.stringify({
        name: 'env-check-test',
        id: clmId,
        is_update_progress: true,
        progress_status: 1,
        clmPayments: [],
      }),
      { ...authed, tags: { name: 'PUT /api/v3/clms/:id/update/draft' } }
    );
    console.log(`[env-check] clm/update/draft status=${res.status} duration=${Date.now() - start}ms body=${res.body?.slice(0, 300)}`);

    check(res, { '6. CLM 임시저장 HTTP 200': (r) => r.status === 200 });
  }

  // ── 7. CLM 상세 조회 ─────────────────────────────────────────────
  console.log(`[env-check] 7/7 CLM 상세 조회 (id=${clmId})`);
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v3/clms/${clmId}`, {
      ...authed,
      tags: { name: 'GET /api/v3/clms/:id' },
    });
    console.log(`[env-check] clms/detail status=${res.status} duration=${Date.now() - start}ms`);

    check(res, {
      '7. CLM 상세 HTTP 200': (r) => r.status === 200,
      '7. CLM 상세 id 일치': (r) => {
        try { return r.json()?.id === clmId; } catch (_) { return false; }
      },
    });
  }

  console.log('[env-check] 모든 검증 완료');
}
