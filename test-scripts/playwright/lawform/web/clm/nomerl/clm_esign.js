/**
 * CLM 전자서명 요청 / 현황 확인 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. ESIGN_ACTION=request → CLM 상세에서 전자서명 요청 버튼 클릭
 * 2. ESIGN_ACTION=check   → 전자서명 섹션 현황 스크린샷
 *
 * ENV:
 *   ESIGN_ACTION = request | check  (default: check)
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
    const esignAction = process.env.ESIGN_ACTION ?? 'check';
    const clmId = process.env.CLM_ID;

    await loginWithPage(page, credentials);

    // ── 1. 계약 상세 진입 ────────────────────────────────────────────
    if (clmId) {
        await page.goto(`${URLS.CLM.REVIEW}/${clmId}`);
        await page.waitForLoadState('networkidle');
    } else {
        await page.goto(URLS.CLM.REVIEW);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_clm_esign_list.png` });

        const firstRow = page.locator('table tbody tr').first();
        if (!await firstRow.isVisible()) {
            console.log('[clm_esign] 검토 목록에 항목 없음 — 스킵');
            return;
        }
        await firstRow.click();
        await page.waitForLoadState('networkidle');
    }
    await page.screenshot({ path: `screenshots/${ts()}_clm_esign_detail.png` });

    // ── 2. 전자서명 섹션 확인 ────────────────────────────────────────
    const esignSection = page.locator('text=전자서명').first();
    if (await esignSection.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_clm_esign_section.png` });
    }

    // ── 3. 액션 분기 ────────────────────────────────────────────────
    if (esignAction === 'request') {
        const esignRequestBtn = page.locator('button:has-text("전자서명 요청")').first();
        await esignRequestBtn.waitFor({ state: 'visible', timeout: 10000 });
        await esignRequestBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `screenshots/${ts()}_clm_esign_request_modal.png` });

        const confirmBtn = page.locator('button:has-text("확인")').last();
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
        }

        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_clm_esign_requested.png` });
    } else {
        // check (default) — 현황만 스크린샷
        const statusArea = page.locator('[class*="esign"], [class*="sign"]').first();
        if (await statusArea.isVisible()) {
            await page.screenshot({ path: `screenshots/${ts()}_clm_esign_status.png` });
        } else {
            console.log('[clm_esign] 전자서명 현황 영역 미노출');
        }
    }
}
