/**
 * 송무 상세 조회 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 송무 목록 진입
 * 2. 첫 번째 항목 클릭 → 상세 조회
 * 3. 편집 버튼 확인
 * 4. 첨부파일 / 코멘트 영역 확인
 *
 * ENV:
 *   LITIGATION_ID = 소송 ID (지정 시 해당 URL로 직접 진입)
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { LITIGATION } from '../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');
    const litigationId = process.env.LITIGATION_ID;

    await loginWithPage(page, credentials);

    // ── 1. 송무 상세 진입 ─────────────────────────────────────────────
    if (litigationId) {
        await page.goto(`${URLS.LITIGATION.REVIEW}/${litigationId}`);
        await page.waitForLoadState('networkidle');
    } else {
        await page.goto(URLS.LITIGATION.REVIEW);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_litigation_list.png` });

        const firstRow = page.locator('table tbody tr').first();
        if (!await firstRow.isVisible()) {
            console.log('[litigation_detail] 송무 목록에 항목 없음 — 스킵');
            return;
        }
        await firstRow.click();
        await page.waitForLoadState('networkidle');
    }
    await page.screenshot({ path: `screenshots/${ts()}_litigation_detail.png` });

    // ── 2. 편집 버튼 확인 ────────────────────────────────────────────
    const editBtn = page.locator('button:has-text("편집")').first();
    if (await editBtn.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_litigation_edit_btn.png` });
    }

    // ── 3. 첨부파일 영역 확인 ────────────────────────────────────────
    const attachmentArea = page.locator('[class*="attach"], [class*="file"]').first();
    if (await attachmentArea.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_litigation_attachment.png` });
    }

    // ── 4. 코멘트 / 메모 영역 확인 ──────────────────────────────────
    const commentArea = page.locator('[class*="comment"], [class*="memo"]').first();
    if (await commentArea.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_litigation_comment.png` });
    }
}
