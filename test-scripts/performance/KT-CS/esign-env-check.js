/**
 * KT-CS 전자서명(Esign) 환경 최소 검증 (1인 / 1회)
 * ------------------------------------------------------------
 * 부하 테스트 전에 로그인과 조회 API가 살아 있는지만 확인한다.
 * 생성/전송(write)은 실제 문서를 만들므로 여기선 치지 않는다.
 *
 *   1. POST /api/login/email
 *   2. GET  /api/v2/esign/
 *   3. GET  /api/v2/esign/pending/signer/?progress_status=200
 *      필수 쿼리: progress_status (정수, min 1)
 *      기본: page=0, limit=10, is_completed=2(미완료), email 없음(세션 user_id)
 *   4. GET  /api/v2/esign/statistics
 *
 * BASE_URL은 /api/* 를 받을 수 있는 API origin.
 * 끝에 /api 를 붙여도 origin 만 쓰도록 정규화한다.
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=https://alpha.api.lfdev.io \
 *     -e LOGIN_ID=user@example.com \
 *     -e LOGIN_PASSWORD=secret \
 *     test-scripts/performance/KT-CS/esign-env-check.js
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

function extractToken(res) {
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

function preview(res) {
  try {
    const body = res.json();
    const copy = JSON.parse(JSON.stringify(body));
    const redact = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (/token/i.test(key) && typeof obj[key] === 'string') {
          obj[key] = `${obj[key].slice(0, 12)}...`;
        } else {
          redact(obj[key]);
        }
      }
    };
    redact(copy);
    return JSON.stringify(copy).slice(0, 300);
  } catch (_) {
    return String(res.body || '').slice(0, 300);
  }
}

function step(name, res, extraChecks) {
  const duration = res.timings.duration;
  const checks = { [`${name} HTTP 200`]: (r) => r.status === 200 };
  if (extraChecks) Object.assign(checks, extraChecks);
  const ok = check(res, checks);
  console.log(`[env-check] ${name} status=${res.status} duration=${duration.toFixed(0)}ms ok=${ok}`);
  if (!ok) {
    console.error(`[env-check] ${name} 응답 미리보기: ${preview(res)}`);
  }
  return ok;
}

const RAW_BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const BASE_URL = normalizeApiOrigin(RAW_BASE_URL);
const LOGIN_ID = __ENV.LOGIN_ID || __ENV.EMAIL || __ENV.LOGIN_EMAIL || '';
const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || __ENV.PASSWORD || '';
// 서명 진행(200) + 미완료(2). -e PROGRESS_STATUS=150 등으로 오버라이드
const PROGRESS_STATUS = Number(__ENV.PROGRESS_STATUS || 200);

function pendingSignerUrl() {
  const qs = [
    `progress_status=${PROGRESS_STATUS}`,
    'page=0',
    'limit=10',
    'is_completed=2',
  ].join('&');
  return `${BASE_URL}/api/v2/esign/pending/signer/?${qs}`;
}

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
  console.log(`[env-check] LOGIN_ID=${LOGIN_ID}`);
  return { loginId: LOGIN_ID, loginPassword: LOGIN_PASSWORD };
}

export default function (data) {
  const loginRes = http.post(
    `${BASE_URL}/api/login/email`,
    JSON.stringify({
      email: data.loginId,
      password: data.loginPassword,
      is_mobile: 2,
      browser_name: 'Chrome',
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 k6-esign-env-check',
      is_gld: false,
      attemptCount: 1,
      auth_result: true,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'POST /api/login/email' },
    }
  );

  const token = extractToken(loginRes);

  const loginOk = step('login', loginRes, {
    '로그인 토큰 존재': () => !!token,
  });
  if (!loginOk || !token) return;

  const authed = {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  };

  // 전자서명 목록: 로그인 토큰으로 /api/v2/esign 조회가 되는지 (권한·라우트)
  const listRes = http.get(`${BASE_URL}/api/v2/esign/`, {
    ...authed,
    tags: { name: 'GET /api/v2/esign/' },
  });
  if (!step('esign_list', listRes)) return;

  // 서명 대기 목록: CLM 연동 건 중 세션 user_id 기준 미완료 서명
  // 필수 쿼리 progress_status 없으면 400 "필수 파라미터가 없음"
  const pendingRes = http.get(pendingSignerUrl(), {
    ...authed,
    tags: { name: 'GET /api/v2/esign/pending/signer/' },
  });
  if (!step('pending_list', pendingRes)) return;

  // 통계: 전자서명 집계 API가 살아 있는지 (대시보드/카운트)
  const statsRes = http.get(`${BASE_URL}/api/v2/esign/statistics`, {
    ...authed,
    tags: { name: 'GET /api/v2/esign/statistics' },
  });
  step('statistics', statsRes);
}
