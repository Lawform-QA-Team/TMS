/**
 * 공통 테이블 액션
 */

/** 테이블 첫 번째 행 클릭 후 networkidle 대기. 항목 없으면 에러 throw */
export async function clickFirstRow(page) {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible', timeout: 10000 });
    await firstRow.click();
    await page.waitForLoadState('networkidle');
}

/** 테이블에 데이터 행이 존재하는지 확인 */
export async function hasRows(page) {
    const firstRow = page.locator('table tbody tr').first();
    return firstRow.isVisible({ timeout: 3000 }).catch(() => false);
}

/** n번째 행 클릭 (1-based) */
export async function clickRowAt(page, index) {
    const row = page.locator('table tbody tr').nth(index - 1);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.click();
    await page.waitForLoadState('networkidle');
}
