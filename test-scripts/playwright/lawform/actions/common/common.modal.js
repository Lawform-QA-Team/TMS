/**
 * 공통 모달 액션
 *
 * 모든 확인/취소/입력 모달에 공통으로 사용한다.
 */

/** 모달의 확인 버튼 클릭 후 networkidle 대기 */
export async function confirmModal(page) {
    const confirmBtn = page.locator('button:has-text("확인")').last();
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 모달의 취소 버튼 클릭 */
export async function cancelModal(page) {
    const cancelBtn = page.locator('button:has-text("취소")').first();
    if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForLoadState('networkidle');
    }
}

/** 모달 내 textarea에 텍스트 입력 */
export async function fillTextarea(page, text) {
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill(text);
}

/** 저장 버튼 클릭 (저장/확인 우선순위로 탐색) */
export async function clickSave(page) {
    const saveBtn = page.locator('button:has-text("저장"), button:has-text("확인")').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
    await saveBtn.click();
    await page.waitForLoadState('networkidle');
}
