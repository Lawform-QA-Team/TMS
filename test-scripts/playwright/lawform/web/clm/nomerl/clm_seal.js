/**
 * CLM 인감 날인 요청 / 승인 / 반려 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. SEAL_ACTION=request → CLM 상세에서 인감사용 신청 버튼 클릭
 * 2. SEAL_ACTION=approve → 인감 검토 목록에서 승인 처리
 * 3. SEAL_ACTION=deny    → 인감 검토 목록에서 반려 처리
 *
 * ENV:
 *   SEAL_ACTION = request | approve | deny  (default: approve)
 *   DENY_REASON = 반려 사유 텍스트
 *   CLM_ID      = 계약 ID (지정 시 해당 URL로 직접 진입)
 */
import { URLS } from '../../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../login/login_helper.js';
import { CLM, SEAL } from '../../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');
    const sealAction = process.env.SEAL_ACTION ?? 'approve';
    const denyReason = process.env.DENY_REASON ?? '인감 날인 반려';
    const clmId = process.env.CLM_ID;

    await loginWithPage(page, credentials);

    if (sealAction === 'request') {
        // ── 인감사용 신청 ────────────────────────────────────────────
        if (clmId) {
            await page.goto(`${URLS.CLM.REVIEW}/${clmId}`);
        } else {
            await page.goto(URLS.CLM.REVIEW);
            await page.waitForLoadState('networkidle');
            const firstRow = page.locator('table tbody tr').first();
            if (!await firstRow.isVisible()) {
                console.log('[clm_seal] 검토 목록에 항목 없음 — 스킵');
                return;
            }
            await firstRow.click();
        }
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_clm_seal_detail.png` });

        const sealRequestBtn = page.locator('button:has-text("인감사용 신청")').first();
        await sealRequestBtn.waitFor({ state: 'visible', timeout: 10000 });
        await sealRequestBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `screenshots/${ts()}_clm_seal_request_modal.png` });

        const confirmBtn = page.locator('button:has-text("확인")').last();
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
        }

    } else {
        // ── 인감 검토 목록에서 승인 / 반려 ──────────────────────────
        if (clmId) {
            await page.goto(`${URLS.SEAL.REVIEW}/${clmId}`);
        } else {
            await page.goto(URLS.SEAL.REVIEW);
            await page.waitForLoadState('networkidle');
            await page.screenshot({ path: `screenshots/${ts()}_clm_seal_review_list.png` });

            const firstRow = page.locator('table tbody tr').first();
            if (!await firstRow.isVisible()) {
                console.log('[clm_seal] 인감 검토 목록에 항목 없음 — 스킵');
                return;
            }
            await firstRow.click();
        }
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_clm_seal_review_detail.png` });

        if (sealAction === 'deny') {
            const denyBtn = page.locator('button:has-text("반려")').first();
            await denyBtn.waitFor({ state: 'visible', timeout: 10000 });
            await denyBtn.click();
            await page.waitForTimeout(500);

            const reasonInput = page.locator('textarea').first();
            if (await reasonInput.isVisible()) {
                await reasonInput.fill(denyReason);
            }
            await page.screenshot({ path: `screenshots/${ts()}_clm_seal_deny_modal.png` });

            const confirmBtn = page.locator('button:has-text("확인")').last();
            await confirmBtn.click();
        } else {
            // approve (default)
            const approveBtn = page.locator('button:has-text("승인")').first();
            await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
            await approveBtn.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: `screenshots/${ts()}_clm_seal_approve_modal.png` });

            const confirmBtn = page.locator('button:has-text("확인")').last();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
            }
        }
    }

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_clm_seal_done.png` });
}
