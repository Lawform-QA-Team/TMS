/**
 * Seal 초안 액션
 */
import { SEAL } from '../../selectors/index.js';

/** 신규 등록 버튼 클릭 */
export async function clickNewSealButton(page) {
    const btn = page.locator('button:has-text("신규")').first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    await page.waitForLoadState('networkidle');
}

/** 날짜 입력 영역 노출 확인 */
export async function assertDateInputVisible(page) {
    const input = page.locator(SEAL.SETUP_INPUT.INPUT_YYYY_MM_DD);
    await input.waitFor({ state: 'visible', timeout: 5000 });
}

/** 담당자 검색 영역 노출 확인 */
export async function assertContactInputVisible(page) {
    const input = page.locator(SEAL.SETUP_INPUT.INPUT_SEARCH_CONTACT);
    await input.waitFor({ state: 'visible', timeout: 5000 });
}

/** 첨부파일 영역 노출 확인 */
export async function assertAttachmentVisible(page) {
    const input = page.locator(SEAL.READ.INPUT_ATTACHMENT_FILEUPLOAD);
    await input.waitFor({ state: 'visible', timeout: 5000 });
}
