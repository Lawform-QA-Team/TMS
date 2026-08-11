/**
 * 설정 (결재 흐름) 조회 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 설정 메인 페이지 진입
 * 2. CLM 결재선 설정 영역 확인
 * 3. 카테고리 추가 버튼 확인
 * 4. 계약 옵션 설정 확인
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { SETUP } from '../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // ── 1. 설정 메인 진입 ──────────────────────────────────────────
    await page.goto(URLS.SETTING.SETUP);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_setup_main.png` });

    // ── 2. 결재선 목록 버튼 확인 ───────────────────────────────────
    const listBtn = page.locator(SETUP.INDEX.BUTTON_LIST);
    if (await listBtn.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_setup_approval_list_btn.png` });
    }

    // ── 3. CLM 결재 사용자 모달 오픈 버튼 확인 ─────────────────────
    const approvalModalBtn = page.locator(SETUP.INDEX.BUTTON_IS_VISIBLE_CLM_APPROVAL_USER_MODAL);
    if (await approvalModalBtn.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_setup_approval_modal_btn.png` });
    }

    // ── 4. 하위 카테고리 추가 인풋 확인 ────────────────────────────
    const subCategoryInput = page.locator(SETUP.MAIN_CATEGORIES.INPUT_ADD_SUB_CATEGORY_NAME);
    if (await subCategoryInput.first().isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_setup_category_input.png` });
    }

    // ── 5. 계약 옵션 관리 라디오 버튼 확인 ─────────────────────────
    const requesterRadio = page.locator(SETUP.OPTION_CONTRACT_OPTION_MANAGEMENT.RADIO_REQUESTER_OPTION);
    if (await requesterRadio.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_setup_contract_options.png` });
    }
}
