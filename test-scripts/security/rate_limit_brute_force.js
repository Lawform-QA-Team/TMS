/**
 * Rate Limiting / Brute Force 방어 검증
 *
 * 실행 예:
 *   k6 run k6/rate-limit-brute-force.js
 *   k6 run -e TARGET_BASE_URL=https://staging.example.com k6/rate-limit-brute-force.js
 *
 * 주의:
 *  - 반드시 스테이징/QA 환경에서만 실행 (운영 환경 대상 금지)
 *  - 사전에 대상팀에 실행 시간대 공지 및 승인 필요
 *  - 계정 잠금 정책이 있다면 테스트 후 잠긴 계정 초기화 필요
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.TARGET_BASE_URL || "https://staging.example.com";

// 커스텀 메트릭
const bruteForceBlocked = new Rate("brute_force_blocked_rate"); // 429/423 등으로 차단된 비율
const bruteForceLeaked = new Counter("brute_force_success_count"); // 차단 없이 로그인 성공한 횟수 (0이어야 정상)
const rateLimitTriggered = new Rate("rate_limit_triggered_rate");
const loginLatency = new Trend("login_latency_ms");

export const options = {
  scenarios: {
    // 시나리오 1: 로그인 Brute Force 저항성 - 동일 계정에 대해 짧은 시간 내 반복 시도
    brute_force_login: {
      executor: "constant-vus",
      vus: 5,
      duration: "30s",
      exec: "bruteForceLogin",
      tags: { scenario: "brute_force" },
    },
    // 시나리오 2: 일반 API 엔드포인트 Rate Limit 검증 - 짧은 시간에 대량 요청
    api_rate_limit: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      stages: [
        { target: 20, duration: "10s" }, // 서서히 증가
        { target: 100, duration: "20s" }, // 급격히 증가 - 임계치 초과 유도
        { target: 100, duration: "10s" }, // 유지
        { target: 0, duration: "5s" }, // 종료
      ],
      exec: "apiRateLimit",
      tags: { scenario: "rate_limit" },
      startTime: "35s", // brute_force 시나리오 이후 시작
    },
  },
  thresholds: {
    // 목표: brute force 시도의 대부분이 차단(429/423)되어야 함
    brute_force_blocked_rate: ["rate>0.8"],
    // 목표: 잠금/제한 없이 성공적으로 로그인되는 경우가 없어야 함 (실패 threshold로 즉시 인지)
    brute_force_success_count: ["count==0"],
    // 목표: 과도한 트래픽 시 Rate Limit이 실제로 발동해야 함
    rate_limit_triggered_rate: ["rate>0.3"],
    http_req_duration: ["p(95)<3000"],
  },
};

const TARGET_ACCOUNT = {
  email: __ENV.TARGET_ACCOUNT_EMAIL || "brute-force-test@example.com",
  // 의도적으로 틀린 비밀번호 목록 - 실제 계정 비밀번호와 무관해야 함
  wrongPasswords: [
    "password123",
    "Password1!",
    "qwerty123",
    "123456789",
    "admin1234",
    "test1234!",
    "letmein123",
    "welcome123",
  ],
};

export function bruteForceLogin() {
  group("login brute force attempt", () => {
    const password =
      TARGET_ACCOUNT.wrongPasswords[
        Math.floor(Math.random() * TARGET_ACCOUNT.wrongPasswords.length)
      ];

    const payload = JSON.stringify({
      email: TARGET_ACCOUNT.email,
      password: password,
    });

    const params = {
      headers: { "Content-Type": "application/json" },
      tags: { name: "login_attempt" },
    };

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);
    loginLatency.add(Date.now() - start);

    const isBlocked = res.status === 429 || res.status === 423; // Too Many Requests / Locked
    const isUnauthorized = res.status === 401;
    const isUnexpectedSuccess = res.status === 200;

    bruteForceBlocked.add(isBlocked);

    if (isUnexpectedSuccess) {
      // 틀린 비밀번호로 로그인이 성공한다면 심각한 결함 - 즉시 확인 필요
      bruteForceLeaked.add(1);
    }

    check(res, {
      "차단(429/423) 또는 정상 인증실패(401) 응답": (r) =>
        isBlocked || isUnauthorized,
      "틀린 비밀번호로 로그인 성공하지 않음": () => !isUnexpectedSuccess,
    });
  });

  sleep(0.2); // 초당 약 5회 시도 시뮬레이션 (VU당)
}

export function apiRateLimit() {
  group("public api burst request", () => {
    // Rate Limit이 걸려야 하는 대상 엔드포인트로 교체 (인증 불필요 공개 API 권장)
    const res = http.get(`${BASE_URL}/api/health`, {
      tags: { name: "burst_request" },
    });

    const isRateLimited = res.status === 429;
    rateLimitTriggered.add(isRateLimited);

    check(res, {
      "응답 수신됨": (r) => r.status !== 0,
      "5xx 서버 에러 없이 처리됨 (429는 정상)": (r) =>
        r.status < 500 || r.status === 429,
    });
  });
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        brute_force_blocked_rate:
          data.metrics.brute_force_blocked_rate?.values?.rate,
        brute_force_leak_count:
          data.metrics.brute_force_success_count?.values?.count,
        rate_limit_triggered_rate:
          data.metrics.rate_limit_triggered_rate?.values?.rate,
        p95_latency_ms: data.metrics.http_req_duration?.values?.["p(95)"],
      },
      null,
      2,
    ),
  };
}
