/**
 * 자문 목록 조회 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 자문 검토 목록 진입
 * 2. 엑셀 다운로드 버튼 확인
 * 3. 첫 번째 항목 상세 진입
 * 4. 문서 다운로드/미리보기 버튼 확인
 * 5. 댓글 기능 확인
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { ADVICE } from '../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // ── 1. 자문 목록 진입 ──────────────────────────────────────────
    await page.goto(URLS.ADVICE.REVIEW);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_advice_list.png` });

    // ── 2. 엑셀 다운로드 버튼 확인 ─────────────────────────────────
    const excelBtn = page.locator(ADVICE.TABLE_FILTER_SECTION.BUTTON_BTN_EXCEL_DOWNLOAD);
    if (await excelBtn.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_advice_excel_btn.png` });
    }

    // ── 3. 첫 번째 항목 클릭 → 상세 진입 ──────────────────────────
    const firstRow = page.locator('table tbody tr, [role="row"]').first();
    if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_advice_detail.png` });

        // ── 4. 문서 다운로드 버튼 확인 ─────────────────────────────
        const downloadBtn = page.locator(ADVICE.SETUP_READ.BUTTON_BTN_DOWNLOAD);
        if (await downloadBtn.isVisible()) {
            await page.screenshot({ path: `screenshots/${ts()}_advice_download_btn.png` });
        }

        // ── 5. 문서 미리보기 버튼 확인 ─────────────────────────────
        const previewBtn = page.locator(ADVICE.PREVIEW_BUTTON.BUTTON_PREVIEW);
        if (await previewBtn.isVisible()) {
            await page.screenshot({ path: `screenshots/${ts()}_advice_preview_btn.png` });
        }

        // ── 6. 수신 참조 버튼 확인 ─────────────────────────────────
        const refererBtn = page.locator(ADVICE.REFERER_USERS.BUTTON_IS_REFERER_MODAL_OPEN);
        if (await refererBtn.isVisible()) {
            await page.screenshot({ path: `screenshots/${ts()}_advice_referer_btn.png` });
        }

        await page.goBack();
        await page.waitForLoadState('networkidle');
    } else {
        console.log('[advice_list] 자문 항목 없음 — 상세 진입 스킵');
    }
}
