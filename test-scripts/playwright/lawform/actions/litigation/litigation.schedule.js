/**
 * Litigation 일정 액션
 */

/** 일정 탭으로 이동 */
export async function clickScheduleTab(page) {
    const tab = page.locator('button:has-text("일정"), [role="tab"]:has-text("일정")').first();
    if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(500);
    }
}

/** 일정 추가 모달 열기 (확인 없이 — 모달 진입만 확인 후 취소) */
export async function openAddScheduleModal(page) {
    const btn = page.locator('button:has-text("일정 추가"), button:has-text("추가")').first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    await page.waitForTimeout(500);
}

/** 월/주/일 뷰 전환 */
export async function switchCalendarView(page, view) {
    const labels = { month: '월', week: '주', day: '일' };
    const btn = page.locator(`button:has-text("${labels[view] ?? view}")`).first();
    if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(500);
    }
}
