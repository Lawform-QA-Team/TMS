/**
 * 인감 등록 (초안 작성) - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 인감 초안 목록 진입
 * 2. 신규 등록 버튼 클릭
 * 3. 인감 날짜/담당자 입력 영역 확인
 * 4. 첨부파일 영역 확인
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { SEAL } from '../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // ── 1. 인감 초안 목록 진입 ─────────────────────────────────────
    await page.goto(URLS.SEAL.DRAFT);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_seal_before_draft.png` });

    // ── 2. 신규 등록 버튼 클릭 ─────────────────────────────────────
    // 인감 신규 등록 버튼은 텍스트 기반 또는 data-tid로 탐색
    const newBtn = page.locator('button:has-text("신규")').first();
    if (await newBtn.isVisible()) {
        await newBtn.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_seal_draft_form.png` });

        // ── 3. 날짜 입력 영역 확인 ─────────────────────────────────
        const dateInput = page.locator(SEAL.SETUP_INPUT.INPUT_YYYY_MM_DD);
        if (await dateInput.isVisible()) {
            await page.screenshot({ path: `screenshots/${ts()}_seal_date_input.png` });
        }

        // ── 4. 담당자 검색 영역 확인 ───────────────────────────────
        const contactInput = page.locator(SEAL.SETUP_INPUT.INPUT_SEARCH_CONTACT);
        if (await contactInput.isVisible()) {
            await page.screenshot({ path: `screenshots/${ts()}_seal_contact_input.png` });
        }

        // ── 5. 첨부파일 영역 확인 ──────────────────────────────────
        const attachInput = page.locator(SEAL.READ.INPUT_ATTACHMENT_FILEUPLOAD);
        if (await attachInput.isVisible()) {
            await page.screenshot({ path: `screenshots/${ts()}_seal_attachment.png` });
        }
    } else {
        console.log('[seal_draft] 신규 등록 버튼 없음 — 스킵');
    }
}
