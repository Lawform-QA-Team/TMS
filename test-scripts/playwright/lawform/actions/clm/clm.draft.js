/**
 * CLM 초안 액션
 */
import { CLM } from '../../selectors/index.js';
import { confirmModal } from '../common/common.modal.js';

/** 신규 검토 요청 버튼 클릭 → 확인 모달 처리 */
export async function clickNewReviewRequest(page) {
    const btn = page.locator(CLM.DRAFT_CREATE_BUTTON.BUTTON_NEW_REVIEW_REQUEST);
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    await page.waitForLoadState('networkidle');
}

/** 임시저장 버튼 클릭 */
export async function saveDraft(page) {
    const btn = page.locator(CLM.HEADER_BUTTONS.BUTTON_UPDATE_DRAFT);
    if (await btn.isVisible()) {
        await btn.click();
        await confirmModal(page);
    }
}

/** 계약 중단/취소 버튼 클릭 */
export async function stopDraft(page, reason = '자동화 테스트 중단') {
    const btn = page.locator('button:has-text("계약 중단"), button:has-text("계약 취소")').first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    await page.waitForTimeout(500);
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) await textarea.fill(reason);
    await confirmModal(page);
}
