/**
 * CLM 재무 검토 요청 / 승인 / 반려 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. APPROVE_TYPE=request → 법무 검토 완료 계약에서 재무검토 요청 버튼 클릭
 * 2. APPROVE_TYPE=approve → 재무 담당자로 승인 처리
 * 3. APPROVE_TYPE=deny    → 재무 담당자로 반려 처리
 *
 * ENV:
 *   APPROVE_TYPE = request | approve | deny  (default: approve)
 *   DENY_REASON  = 반려 사유 텍스트
 *   CLM_ID       = 계약 ID (지정 시 해당 URL로 직접 진입)
 */
import { URLS } from '../../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../login/login_helper.js';
import { CLM } from '../../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');
    const approveType = process.env.APPROVE_TYPE ?? 'approve';
    const denyReason = process.env.DENY_REASON ?? '재무 검토 후 반려';
    const clmId = process.env.CLM_ID;

    await loginWithPage(page, credentials);

    // ── 1. 계약 상세 진입 ─────────────────────────────────────────────
    if (clmId) {
        await page.goto(`${URLS.CLM.REVIEW}/${clmId}`);
        await page.waitForLoadState('networkidle');
    } else {
        await page.goto(URLS.CLM.REVIEW);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_clm_financial_list.png` });

        const firstRow = page.locator('table tbody tr').first();
        if (!await firstRow.isVisible()) {
            console.log('[clm_financial] 검토 목록에 항목 없음 — 스킵');
            return;
        }
        await firstRow.click();
        await page.waitForLoadState('networkidle');
    }
    await page.screenshot({ path: `screenshots/${ts()}_clm_financial_detail.png` });

    // ── 2. 단계별 분기 ────────────────────────────────────────────────
    if (approveType === 'request') {
        // 법무 검토 완료 후 요청자가 재무검토 요청
        const requestBtn = page.locator('button:has-text("재무검토 요청")').first();
        await requestBtn.waitFor({ state: 'visible', timeout: 10000 });
        await requestBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `screenshots/${ts()}_clm_financial_request_modal.png` });

        const confirmBtn = page.locator('button:has-text("확인")').last();
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
        }

    } else if (approveType === 'deny') {
        const denyBtn = page.locator('button:has-text("반려")').first();
        await denyBtn.waitFor({ state: 'visible', timeout: 10000 });
        await denyBtn.click();
        await page.waitForTimeout(500);

        const reasonInput = page.locator('textarea').first();
        if (await reasonInput.isVisible()) {
            await reasonInput.fill(denyReason);
        }
        await page.screenshot({ path: `screenshots/${ts()}_clm_financial_deny_modal.png` });

        const confirmBtn = page.locator('button:has-text("확인")').last();
        await confirmBtn.click();

    } else {
        // approve (default)
        const approveBtn = page.locator('button:has-text("승인")').first();
        await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
        await approveBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `screenshots/${ts()}_clm_financial_approve_modal.png` });

        const confirmBtn = page.locator('button:has-text("확인")').last();
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
        }
    }

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_clm_financial_done.png` });
}
