/**
 * JWT 조작(Tampering) 공격 시나리오 검증
 *
 * 사전 조건: npm install --save-dev jsonwebtoken
 *
 * 커버 범위:
 *  1. alg:none 공격 - 서명 검증 우회 시도
 *  2. 서명 위조 - 임의 시크릿/키로 재서명한 토큰
 *  3. payload 조작 - role/tenantId 등 권한 필드 임의 변경
 *  4. 만료된 토큰 재사용
 *  5. kid(Key ID) 헤더 조작을 통한 키 혼동(Key Confusion) 공격
 *
 * 실행: npx playwright test tests/security/jwt-tampering.spec.js
 */

const { test, expect, request } = require("@playwright/test");
const jwt = require("jsonwebtoken");

const BASE_URL = process.env.TARGET_BASE_URL || "https://staging.example.com";
const PROTECTED_ENDPOINT = "/api/orders"; // 인증 필요한 임의 엔드포인트로 교체

const TEST_ACCOUNT = {
  email: process.env.TENANT_A_USER_EMAIL,
  password: process.env.TENANT_A_USER_PASSWORD,
};

/**
 * Base64Url 인코딩 헬퍼 (alg:none 공격용 - 라이브러리 없이 수동 조립)
 */
function base64urlEncode(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * 지정한 토큰으로 보호된 엔드포인트에 요청을 보내는 헬퍼
 */
async function requestWithToken(apiContext, token) {
  return apiContext.get(PROTECTED_ENDPOINT, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

test.describe("JWT 조작 공격 시나리오", () => {
  let apiContext;
  let validToken;
  let decodedPayload;

  test.beforeAll(async () => {
    apiContext = await request.newContext({ baseURL: BASE_URL });

    const loginRes = await apiContext.post("/api/auth/login", {
      data: TEST_ACCOUNT,
    });
    expect(
      loginRes.ok(),
      "사전 로그인 실패 - 테스트 계정 확인 필요",
    ).toBeTruthy();

    const body = await loginRes.json();
    validToken = body.accessToken || body.token;

    // 서명 검증 없이 payload만 디코딩 (구조 파악용)
    decodedPayload = jwt.decode(validToken);
    expect(decodedPayload, "토큰 디코딩 실패 - JWT 형식이 아님").not.toBeNull();
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test("baseline: 정상 토큰은 인증되어야 함", async () => {
    const res = await requestWithToken(apiContext, validToken);
    expect(
      res.ok(),
      "정상 토큰인데 인증 실패 - 사전 조건 확인 필요",
    ).toBeTruthy();
  });

  test("alg:none 공격 - 서명 없는 토큰이 거부되어야 함", async () => {
    const header = { alg: "none", typ: "JWT" };
    const payload = { ...decodedPayload };

    // alg:none 토큰은 서명부가 비어있음
    const forgedToken = `${base64urlEncode(header)}.${base64urlEncode(payload)}.`;

    const res = await requestWithToken(apiContext, forgedToken);
    expect(
      [401, 403].includes(res.status()),
      `취약점: alg:none 토큰이 수락됨 (status=${res.status()})`,
    ).toBeTruthy();
  });

  test("서명 위조 - 임의 시크릿으로 재서명한 토큰이 거부되어야 함", async () => {
    const forgedToken = jwt.sign(decodedPayload, "attacker-guessed-secret", {
      algorithm: "HS256",
    });

    const res = await requestWithToken(apiContext, forgedToken);
    expect(
      [401, 403].includes(res.status()),
      `취약점: 임의 시크릿으로 서명한 토큰이 수락됨 (status=${res.status()})`,
    ).toBeTruthy();
  });

  test("payload 조작 - role 필드를 admin으로 변경 시 거부되어야 함", async () => {
    if (!("role" in decodedPayload)) {
      test.skip(true, "payload에 role 클레임이 없어 해당 시나리오 스킵");
    }

    const tamperedPayload = { ...decodedPayload, role: "admin" };
    // 서명 검증이 제대로 되는 서버라면, 시크릿을 모르는 상태에서 서명한 토큰은
    // 어차피 위 케이스와 동일하게 거부되어야 함. 여기서는 별도로 조작 여부 자체를 검증.
    const tamperedToken = jwt.sign(tamperedPayload, "attacker-guessed-secret", {
      algorithm: "HS256",
    });

    const res = await requestWithToken(apiContext, tamperedToken);
    expect(
      [401, 403].includes(res.status()),
      `치명적 취약점: role 조작 토큰으로 인증 성공 (status=${res.status()})`,
    ).toBeTruthy();
  });

  test("payload 조작 - tenantId 변경 시 거부되어야 함 (테넌트 격리)", async () => {
    if (!("tenantId" in decodedPayload)) {
      test.skip(true, "payload에 tenantId 클레임이 없어 해당 시나리오 스킵");
    }

    const tamperedPayload = {
      ...decodedPayload,
      tenantId:
        decodedPayload.tenantId === "tenant-a" ? "tenant-b" : "tenant-a",
    };
    const tamperedToken = jwt.sign(tamperedPayload, "attacker-guessed-secret", {
      algorithm: "HS256",
    });

    const res = await requestWithToken(apiContext, tamperedToken);
    expect([401, 403]).toContain(res.status());
  });

  test("만료된 토큰은 거부되어야 함", async () => {
    const expiredPayload = {
      ...decodedPayload,
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600, // 1시간 전 만료
    };
    const expiredToken = jwt.sign(expiredPayload, "attacker-guessed-secret", {
      algorithm: "HS256",
    });

    const res = await requestWithToken(apiContext, expiredToken);
    expect([401, 403]).toContain(res.status());
  });

  test("kid 헤더 조작(Key Confusion) - 경로 조작된 kid가 거부되어야 함", async () => {
    // 서버가 kid 값을 파일 경로 등으로 사용해 키를 조회하는 구현일 경우
    // Path Traversal / 공개키를 HMAC 시크릿으로 오용하는 공격 가능성 점검
    const header = {
      alg: "HS256",
      typ: "JWT",
      kid: "../../../../dev/null",
    };
    const forgedToken = `${base64urlEncode(header)}.${base64urlEncode(
      decodedPayload,
    )}.forged-signature`;

    const res = await requestWithToken(apiContext, forgedToken);
    expect(
      [401, 403].includes(res.status()),
      `취약점: 조작된 kid 헤더 토큰이 수락됨 (status=${res.status()})`,
    ).toBeTruthy();
  });

  test("Authorization 헤더 누락 시 접근이 거부되어야 함", async () => {
    const res = await requestWithToken(apiContext, null);
    expect([401, 403]).toContain(res.status());
  });

  test("잘못된 형식의 토큰(랜덤 문자열)이 거부되어야 함", async () => {
    const res = await requestWithToken(apiContext, "not.a.valid.jwt.token");
    expect([401, 403]).toContain(res.status());
  });
});
