/**
 * 법률 자문 법무 처리 (승인 / 반려) - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 자문 검토 목록 진입
 * 2. 첫 번째 항목 상세 진입
 * 3. APPROVE_TYPE=approve → 자문 완료 처리
 * 4. APPROVE_TYPE=deny    → 반려 처리 + 사유 입력
 *
 * ENV:
 *   APPROVE_TYPE = approve | deny  (default: approve)
 *   DENY_REASON  = 반려 사유 텍스트
 *   ADVICE_ID    = 자문 ID (지정 시 해당 URL로 직접 진입)
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');
    const approveType = process.env.APPROVE_TYPE ?? 'approve';
    const denyReason = process.env.DENY_REASON ?? '자문 검토 후 반려';
    const adviceId = process.env.ADVICE_ID;

    await loginWithPage(page, credentials);

    // ── 1. 자문 상세 진입 ─────────────────────────────────────────────
    if (adviceId) {
        await page.goto(`${URLS.ADVICE.REVIEW}/${adviceId}`);
        await page.waitForLoadState('networkidle');
    } else {
        await page.goto(URLS.ADVICE.REVIEW);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_advice_lagel_list.png` });

        const firstRow = page.locator('table tbody tr').first();
        if (!await firstRow.isVisible()) {
            console.log('[advice_lagel] 자문 목록에 항목 없음 — 스킵');
            return;
        }
        await firstRow.click();
        await page.waitForLoadState('networkidle');
    }
    await page.screenshot({ path: `screenshots/${ts()}_advice_lagel_detail.png` });

    // ── 2. 승인 / 반려 분기 ──────────────────────────────────────────
    if (approveType === 'deny') {
        const denyBtn = page.locator('button:has-text("반려")').first();
        await denyBtn.waitFor({ state: 'visible', timeout: 10000 });
        await denyBtn.click();
        await page.waitForTimeout(500);

        const reasonInput = page.locator('textarea').first();
        if (await reasonInput.isVisible()) {
            await reasonInput.fill(denyReason);
        }
        await page.screenshot({ path: `screenshots/${ts()}_advice_lagel_deny_modal.png` });

        const confirmBtn = page.locator('button:has-text("확인")').last();
        await confirmBtn.click();
    } else {
        // approve (default)
        const approveBtn = page.locator('button:has-text("자문완료"), button:has-text("승인")').first();
        await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
        await approveBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `screenshots/${ts()}_advice_lagel_approve_modal.png` });

        const confirmBtn = page.locator('button:has-text("확인")').last();
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
        }
    }

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_advice_lagel_done.png` });
}
