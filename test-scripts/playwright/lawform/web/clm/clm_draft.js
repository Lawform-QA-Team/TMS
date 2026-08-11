/**
 * CLM 계약 작성 (초안 등록) - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 신규 검토 요청 버튼 클릭
 * 2. 계약서 업로드 영역 확인
 * 3. 임시저장 / 제출 버튼 확인
 * 4. 목록 복귀
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { CLM } from '../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // ── 1. CLM 초안 목록 진입 ──────────────────────────────────────
    await page.goto(URLS.CLM.DRAFT);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_clm_before_draft.png` });

    // ── 2. 신규 검토 요청 클릭 ─────────────────────────────────────
    const newReviewBtn = page.locator(CLM.DRAFT_CREATE_BUTTON.BUTTON_NEW_REVIEW_REQUEST);
    await newReviewBtn.waitFor({ state: 'visible', timeout: 10000 });
    await newReviewBtn.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_clm_draft_form.png` });

    // ── 3. 임시저장 / 목록 버튼 존재 확인 ──────────────────────────
    const headerUpdateBtn = page.locator(CLM.HEADER_BUTTONS.BUTTON_UPDATE_DRAFT);
    if (await headerUpdateBtn.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_clm_draft_header.png` });
    }

    // ── 4. 계약서 첨부 영역 확인 ───────────────────────────────────
    const attachmentInput = page.locator(CLM.ATTACHMENT_ROW.INPUT_FILEUPLOAD);
    if (await attachmentInput.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_clm_attachment_area.png` });
    }

    // ── 5. 목록 복귀 ───────────────────────────────────────────────
    await page.goto(URLS.CLM.DRAFT);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_clm_after_draft.png` });
}
