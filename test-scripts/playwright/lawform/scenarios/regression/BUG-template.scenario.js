/**
 * BUG-TEMPLATE: 버그 리그레션 시나리오 작성 가이드
 *
 * 사용법:
 *   1. 이 파일을 복사하여 BUG-{이슈번호}.scenario.js 로 저장
 *   2. 버그 재현에 필요한 actions를 import하여 조합
 *   3. 실패 지점에 expect() 추가 — 버그가 수정되면 test가 통과해야 함
 *
 * 실행:
 *   npx playwright test --grep "BUG-" --config=lawform/playwright.lawform.config.js
 *
 * ────────────────────────────────────────────────────────────────────────────
 * 예시: 법무 승인 후 재무요청 시 상태가 갱신되지 않는 버그
 * ────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '@playwright/test';
import { login }                  from '../../actions/common/common.login.js';
import { gotoDetailOrFirst }      from '../../actions/clm/clm.navigate.js';
import { approveLegalReview }     from '../../actions/clm/clm.legal.js';
import { requestFinancialReview } from '../../actions/clm/clm.financial.js';

test.skip('[BUG-TEMPLATE] 버그 리그레션 예시 — 실제 사용 시 skip 제거', async ({ page }) => {
    // ── Step 1: 로그인 ──────────────────────────────────────────────
    await login(page);

    // ── Step 2: 버그 재현 조건 세팅 ─────────────────────────────────
    // CLM_ID 환경변수로 특정 계약 지정 가능
    await gotoDetailOrFirst(page);

    // ── Step 3: 액션 조합으로 버그 재현 ─────────────────────────────
    await approveLegalReview(page);
    await requestFinancialReview(page);

    // ── Step 4: 버그 재현 확인 ───────────────────────────────────────
    // 버그가 있으면 아래 expect가 실패, 수정 후엔 통과
    await expect(page.locator('text=재무 검토 중')).toBeVisible({ timeout: 5000 });
});
