/**
 * KT-CS 환경 최소 검증 (1인 / 1회)
 * ------------------------------------------------------------
 * 부하 테스트 전에 대상 서버가 살아 있고, 계정으로 로그인이
 * 되는지만 확인한다. 편집기 플로우·CSV·샘플 파일은 쓰지 않는다.
 *
 * BASE_URL은 FE 화면 주소가 아니라 /api/* 를 받을 수 있는
 * API(백엔드) origin 이다. k6/http 가 브라우저 없이
 * POST ${BASE_URL}/api/login/email 을 직접 호출한다.
 *   - BE 직접 주소: http://localhost:3017  (또는 API 게이트웨이)
 *   - 같은 도메인에서 /api 를 BE로 프록시하는 경우에만
 *     사용자가 보는 공개 도메인을 넣어도 동작한다.
 * FE SPA 주소만 넣으면 /api/login/email 이 404 난다.
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=https://alpha.api.lfdev.io \
 *     -e LOGIN_ID=user@example.com \
 *     -e LOGIN_PASSWORD=secret \
 *     test-scripts/performance/KT-CS/editer-env-check.js
 *
 * BASE_URL 끝에 /api 를 붙여도 된다. 스크립트가 /api/login/email 을
 * 붙이므로 중복되면 /api 를 떼고 origin 만 사용한다.
 */

import http from 'k6/http';
import { check } from 'k6';

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

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
  },
};

export function setup() {
  if (!LOGIN_ID || !LOGIN_PASSWORD) {
    throw new Error(
      'LOGIN_ID(또는 EMAIL)와 LOGIN_PASSWORD(또는 PASSWORD) 환경변수가 필요합니다.'
    );
  }
  if (RAW_BASE_URL.replace(/\/+$/, '') !== BASE_URL) {
    console.log(`[env-check] BASE_URL 정규화: ${RAW_BASE_URL} → ${BASE_URL}`);
  }
  console.log(`[env-check] BASE_URL=${BASE_URL} (API origin)`);
  console.log(`[env-check] LOGIN_PATH=${BASE_URL}/api/login/email`);
  console.log(`[env-check] LOGIN_ID=${LOGIN_ID}`);
  return { loginId: LOGIN_ID, loginPassword: LOGIN_PASSWORD };
}

export default function (data) {
  const payload = JSON.stringify({
    email: data.loginId,
    password: data.loginPassword,
    is_mobile: 2,
    browser_name: 'Chrome',
    user_agent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 k6-env-check',
    is_gld: false,
    attemptCount: 1,
    auth_result: true,
  });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/login/email`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /api/login/email' },
  });
  const duration = Date.now() - start;

  let tokenPresent = false;
  let bodyPreview = '';
  try {
    const body = res.json();
    tokenPresent = !!(
      body?.token ||
      body?.accessToken ||
      body?.access_token ||
      body?.data?.token ||
      body?.data?.accessToken
    );
    bodyPreview = JSON.stringify(body).slice(0, 300);
  } catch (e) {
    bodyPreview = String(res.body || '').slice(0, 300);
  }

  const ok = check(res, {
    '로그인 HTTP 200': (r) => r.status === 200,
    '로그인 토큰 존재': () => tokenPresent,
  });

  console.log(
    `[env-check] login status=${res.status} duration=${duration}ms token=${tokenPresent} ok=${ok}`
  );
  if (!ok) {
    console.error(`[env-check] 응답 미리보기: ${bodyPreview}`);
  }
}
