/**
 * IDOR / 멀티테넌시 격리 / 인가(Authorization) 검증 테스트
 *
 * 사전 조건:
 *  - 서로 다른 테넌트에 속한 2개 이상의 테스트 계정 필요 (tenantA, tenantB)
 *  - 각 테넌트 내에서도 권한이 다른 계정 필요 (일반 사용자 / 관리자)
 *  - .env 또는 CI Secret으로 계정 정보 주입 (하드코딩 금지)
 *
 * 실행: npx playwright test tests/security/idor-tenant-isolation.spec.js
 */

const { test, expect, request } = require("@playwright/test");

const BASE_URL = process.env.TARGET_BASE_URL || "https://staging.example.com";

// 테스트 계정 - 반드시 별도 격리된 테스트 테넌트/데이터로 구성할 것 (운영 데이터 절대 사용 금지)
const ACCOUNTS = {
  tenantA_user: {
    email: process.env.TENANT_A_USER_EMAIL,
    password: process.env.TENANT_A_USER_PASSWORD,
  },
  tenantB_user: {
    email: process.env.TENANT_B_USER_EMAIL,
    password: process.env.TENANT_B_USER_PASSWORD,
  },
  tenantA_admin: {
    email: process.env.TENANT_A_ADMIN_EMAIL,
    password: process.env.TENANT_A_ADMIN_PASSWORD,
  },
};

/**
 * 로그인 후 인증 토큰(Bearer)을 반환하는 헬퍼
 * 실제 로그인 API 스펙에 맞게 endpoint/payload/응답 파싱 부분 수정 필요
 */
async function login(apiContext, account) {
  const res = await apiContext.post("/api/auth/login", {
    data: { email: account.email, password: account.password },
  });
  expect(res.ok(), `로그인 실패: ${account.email}`).toBeTruthy();
  const body = await res.json();
  return body.accessToken || body.token;
}

/**
 * 특정 계정으로 로그인된 APIRequestContext 생성
 */
async function createAuthedContext(account) {
  const anonCtx = await request.newContext({ baseURL: BASE_URL });
  const token = await login(anonCtx, account);
  await anonCtx.dispose();

  return request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

test.describe("IDOR - 리소스 접근 통제", () => {
  let tenantAUserCtx;

  test.beforeAll(async () => {
    tenantAUserCtx = await createAuthedContext(ACCOUNTS.tenantA_user);
  });

  test.afterAll(async () => {
    await tenantAUserCtx.dispose();
  });

  test("자신의 리소스는 정상 조회되어야 함 (baseline)", async () => {
    const myResources = await tenantAUserCtx.get("/api/orders?mine=true");
    expect(myResources.ok()).toBeTruthy();
  });

  test("타인 소유 리소스 ID를 순차 대입 시 접근이 차단되어야 함", async () => {
    // 실제 존재하는 타 사용자 리소스 ID 범위로 조정 (테스트 데이터 시딩 필요)
    const suspiciousIds = [1, 2, 3, 100, 101, 999];

    for (const id of suspiciousIds) {
      const res = await tenantAUserCtx.get(`/api/orders/${id}`);

      // 존재하지 않는 리소스는 404, 존재하지만 타인 소유면 403이어야 함
      // 200(OK)으로 타인 데이터가 조회된다면 IDOR 취약점
      expect(
        [403, 404].includes(res.status()),
        `IDOR 의심: /api/orders/${id} 응답 코드 ${res.status()}`,
      ).toBeTruthy();
    }
  });

  test("URL 파라미터 조작으로 타 사용자 프로필 접근이 차단되어야 함", async () => {
    const res = await tenantAUserCtx.get("/api/users/2/profile");
    expect([403, 404]).toContain(res.status());
  });
});

test.describe("멀티테넌시 격리 검증", () => {
  let tenantAUserCtx;
  let tenantBUserCtx;
  let tenantASeededResourceId; // 테넌트A 소유 리소스 ID (사전 시딩 또는 생성 후 저장)

  test.beforeAll(async () => {
    tenantAUserCtx = await createAuthedContext(ACCOUNTS.tenantA_user);
    tenantBUserCtx = await createAuthedContext(ACCOUNTS.tenantB_user);

    // 테넌트A 명의로 리소스 생성 후 ID 확보 (실제 생성 API로 교체)
    const createRes = await tenantAUserCtx.post("/api/orders", {
      data: { item: "security-test-item", quantity: 1 },
    });
    const created = await createRes.json();
    tenantASeededResourceId = created.id;
  });

  test.afterAll(async () => {
    await tenantAUserCtx.dispose();
    await tenantBUserCtx.dispose();
  });

  test("테넌트B 사용자가 테넌트A 리소스에 직접 접근 불가해야 함", async () => {
    const res = await tenantBUserCtx.get(
      `/api/orders/${tenantASeededResourceId}`,
    );
    expect(
      [403, 404].includes(res.status()),
      `테넌트 격리 위반: 테넌트B가 테넌트A 리소스(${tenantASeededResourceId})에 접근 가능 (status=${res.status()})`,
    ).toBeTruthy();
  });

  test("테넌트B 사용자가 테넌트A 리소스를 수정할 수 없어야 함", async () => {
    const res = await tenantBUserCtx.patch(
      `/api/orders/${tenantASeededResourceId}`,
      {
        data: { quantity: 999 },
      },
    );
    expect([403, 404]).toContain(res.status());
  });

  test("테넌트B 사용자가 테넌트A 리소스를 삭제할 수 없어야 함", async () => {
    const res = await tenantBUserCtx.delete(
      `/api/orders/${tenantASeededResourceId}`,
    );
    expect([403, 404]).toContain(res.status());
  });

  test("목록 조회 API가 타 테넌트 데이터를 노출하지 않아야 함", async () => {
    const res = await tenantBUserCtx.get("/api/orders");
    const body = await res.json();
    const list = Array.isArray(body) ? body : body.data || [];

    const leaked = list.some((item) => item.id === tenantASeededResourceId);
    expect(leaked, "목록 API에서 타 테넌트 리소스가 노출됨").toBeFalsy();
  });
});

test.describe("권한 상승 / 인가 우회", () => {
  let generalUserCtx;

  test.beforeAll(async () => {
    generalUserCtx = await createAuthedContext(ACCOUNTS.tenantA_user);
  });

  test.afterAll(async () => {
    await generalUserCtx.dispose();
  });

  test("일반 사용자가 관리자 전용 엔드포인트에 접근할 수 없어야 함", async () => {
    const res = await generalUserCtx.get("/api/admin/users");
    expect([401, 403]).toContain(res.status());
  });

  test("요청 바디에 role 조작을 삽입해도 서버가 신뢰하지 않아야 함", async () => {
    // Mass Assignment / 클라이언트 제공 값으로 인가 판단 여부 테스트
    const res = await generalUserCtx.patch("/api/users/me", {
      data: { name: "test-user", role: "admin", isAdmin: true },
    });

    if (res.ok()) {
      const updated = await res.json();
      expect(
        updated.role,
        "Mass Assignment 취약점: 클라이언트가 전송한 role 값이 그대로 반영됨",
      ).not.toBe("admin");
    }
  });

  test("일반 사용자가 관리자 기능(사용자 삭제)을 호출할 수 없어야 함", async () => {
    const res = await generalUserCtx.delete("/api/admin/users/999");
    expect([401, 403]).toContain(res.status());
  });
});
