/**
 * k6 부하 테스트 스크립트
 * 대상: 로그인 + 편집기 진입 플로우
 * 목표: 9500명 동시 사용자
 *
 * 실행:
 *   k6 run k6/load_test.js
 *   k6 run --env BASE_URL=https://your-api.com k6/load_test.js
 *
 * 결과 출력 (InfluxDB):
 *   k6 run --out influxdb=http://localhost:8086/k6 k6/load_test.js
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { SharedArray } from "k6/data";
import { Trend, Rate, Counter } from "k6/metrics";
import papaparse from "https://jslib.k6.io/papaparse/5.1.1/index.js";

// ──────────────────────────────────────────────
// 환경 변수
// ──────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:3017";

// ──────────────────────────────────────────────
// 커스텀 메트릭
// ──────────────────────────────────────────────
const loginDuration = new Trend("login_duration", true);
const editorGetDuration = new Trend("editor_get_duration", true);
const editorModeDuration = new Trend("editor_editmode_duration", true);
const loginFailRate = new Rate("login_fail_rate");
const editorFailRate = new Rate("editor_fail_rate");
const loginCount = new Counter("login_count");

// ──────────────────────────────────────────────
// 테스트 데이터 (k6/data/users.csv 로드)
// CSV 컬럼: email,password,cfs_id,cfs_collaborator_id
// ──────────────────────────────────────────────
const users = new SharedArray("users", () => {
  const file = open("./data/users.csv");
  return papaparse.parse(file, { header: true, skipEmptyLines: true }).data;
});

// ──────────────────────────────────────────────
// 시나리오 설정
// ──────────────────────────────────────────────
export const options = {
  scenarios: {
    /**
     * 로그인 단독 테스트
     * - 9500 VU까지 점진적 상승
     */
    login_flow: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 500 }, // 워밍업
        { duration: "2m", target: 2000 }, // 상승
        { duration: "2m", target: 5000 }, // 상승
        { duration: "2m", target: 9500 }, // 피크
        { duration: "2m", target: 9500 }, // 유지
        { duration: "1m", target: 0 }, // 쿨다운
      ],
      gracefulRampDown: "30s",
      exec: "loginScenario",
    },

    /**
     * 로그인 후 편집기 진입 테스트
     * - login_flow 종료 후 2분 뒤 시작
     */
    editor_flow: {
      executor: "ramping-vus",
      startTime: "11m", // login_flow 총 10분 + 여유 1분
      startVUs: 0,
      stages: [
        { duration: "2m", target: 2000 },
        { duration: "2m", target: 5000 },
        { duration: "2m", target: 9500 },
        { duration: "3m", target: 9500 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "editorScenario",
    },
  },

  thresholds: {
    // 로그인 95%가 2초 이내
    login_duration: ["p(95)<2000"],
    // 편집기 get 95%가 3초 이내 (S3 signedUrl 생성 포함)
    editor_get_duration: ["p(95)<3000"],
    // 편집 모드 전환 95%가 1초 이내
    editor_editmode_duration: ["p(95)<1000"],
    // 로그인 실패율 1% 미만
    login_fail_rate: ["rate<0.01"],
    // 편집기 실패율 1% 미만
    editor_fail_rate: ["rate<0.01"],
    // HTTP 에러율 1% 미만
    http_req_failed: ["rate<0.01"],
  },
};

// ──────────────────────────────────────────────
// 공통 헤더
// ──────────────────────────────────────────────
const jsonHeaders = {
  "Content-Type": "application/json",
};

// ──────────────────────────────────────────────
// 시나리오 1: 로그인
// ──────────────────────────────────────────────
export function loginScenario() {
  const user = users[__VU % users.length];

  group("로그인", () => {
    const payload = JSON.stringify({
      email: user.email,
      password: user.password,
      is_mobile: 2, // 2: PC
      browser_name: "k6",
      user_agent: "k6-load-test",
      is_gld: false,
      attemptCount: 0,
    });

    const res = http.post(`${BASE_URL}/api/login/email`, payload, {
      headers: jsonHeaders,
      tags: { name: "POST /api/login/email" },
    });

    loginDuration.add(res.timings.duration);
    loginCount.add(1);

    const ok = check(res, {
      "로그인 200 OK": (r) => r.status === 200,
      "로그인 token 존재": (r) => {
        try {
          return JSON.parse(r.body)?.data?.token !== undefined;
        } catch {
          return false;
        }
      },
    });

    loginFailRate.add(!ok);
  });

  sleep(randomBetween(1, 3));
}

// ──────────────────────────────────────────────
// 시나리오 2: 로그인 → 편집기 진입 → 편집 → 종료
// ──────────────────────────────────────────────
export function editorScenario() {
  const user = users[__VU % users.length];

  let token = null;

  // Step 1. 로그인
  group("로그인", () => {
    const payload = JSON.stringify({
      email: user.email,
      password: user.password,
      is_mobile: 2,
      browser_name: "k6",
      user_agent: "k6-load-test",
      is_gld: false,
      attemptCount: 0,
    });

    const res = http.post(`${BASE_URL}/api/login/email`, payload, {
      headers: jsonHeaders,
      tags: { name: "POST /api/login/email" },
    });

    loginDuration.add(res.timings.duration);
    loginCount.add(1);

    const ok = check(res, {
      "로그인 200 OK": (r) => r.status === 200,
    });

    loginFailRate.add(!ok);

    if (ok) {
      try {
        token = JSON.parse(res.body)?.data?.token;
      } catch (_) {}
    }
  });

  if (!token) {
    editorFailRate.add(true);
    sleep(1);
    return;
  }

  const authHeaders = {
    ...jsonHeaders,
    "x-access-token": token,
  };

  sleep(randomBetween(0.5, 1.5));

  // Step 2. Polaris 편집기 데이터 로드
  group("편집기 데이터 로드", () => {
    const payload = JSON.stringify({
      cfsId: parseInt(user.cfs_id),
      cfsCollaboratorId: parseInt(user.cfs_collaborator_id),
      type: "docx",
    });

    const res = http.post(`${BASE_URL}/api/polaris/cfs/get`, payload, {
      headers: authHeaders,
      tags: { name: "POST /api/polaris/cfs/get" },
    });

    editorGetDuration.add(res.timings.duration);

    const ok = check(res, {
      "편집기 로드 200 OK": (r) => r.status === 200,
      "편집기 signedUrl 존재": (r) => {
        try {
          return JSON.parse(r.body)?.data?.signedUrl !== undefined;
        } catch {
          return false;
        }
      },
    });

    editorFailRate.add(!ok);
  });

  sleep(randomBetween(0.5, 1));

  // Step 3. 편집 모드 진입 (mode: 'Y')
  group("편집 모드 진입", () => {
    const payload = JSON.stringify({
      cfsId: parseInt(user.cfs_id),
      mode: "Y",
    });

    const res = http.put(
      `${BASE_URL}/api/polaris/cfs/update/editmode`,
      payload,
      {
        headers: authHeaders,
        tags: { name: "PUT /api/polaris/cfs/update/editmode (Y)" },
      },
    );

    editorModeDuration.add(res.timings.duration);

    check(res, {
      "편집 모드 진입 200 OK": (r) => r.status === 200,
    });
  });

  // 편집 중 작업 시뮬레이션 (3~8초)
  sleep(randomBetween(3, 8));

  // Step 4. 편집 모드 종료 (mode: 'N') - S3 복사 발생
  group("편집 모드 종료", () => {
    const payload = JSON.stringify({
      cfsId: parseInt(user.cfs_id),
      mode: "N",
    });

    const res = http.put(
      `${BASE_URL}/api/polaris/cfs/update/editmode`,
      payload,
      {
        headers: authHeaders,
        tags: { name: "PUT /api/polaris/cfs/update/editmode (N)" },
      },
    );

    editorModeDuration.add(res.timings.duration);

    check(res, {
      "편집 모드 종료 200 OK": (r) => r.status === 200,
    });
  });

  sleep(randomBetween(1, 2));
}

// ──────────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────────
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
