/**
 * [Action] Litigation — 일정 관련
 */

/** 일정 탭 클릭 */
export async function clickScheduleTab(page) {
    const scheduleTab = page.locator('//button[text()="일정"] | //*[@role="tab" and text()="일정"]').first();
    if (await scheduleTab.isVisible()) {
        await scheduleTab.click();
        await page.waitForTimeout(500);
    }
}

/** 일정 추가 모달 열기 */
export async function openAddScheduleModal(page) {
    const addBtn = page.locator('//button[text()="일정 추가"] | //button[text()="추가"]').first();
    if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(500);
    } else {
        console.log('[litigation.schedule] 일정 추가 버튼 없음');
    }
}

/**
 * 캘린더 뷰 전환 (월/주/일)
 * @param {import('k6/browser').Page} page
 * @param {'월'|'주'|'일'} view
 */
export async function switchCalendarView(page, view) {
    const btn = page.locator(`//button[text()="${view}"]`).first();
    if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(500);
    }
}
