/**
 * 공통 테이블 액션
 */

/**
 * 테이블에 행이 있는지 확인
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
export async function hasRows(page) {
    const firstRow = page.locator('table tbody tr').first();
    return firstRow.isVisible({ timeout: 3000 }).catch(() => false);
}

/**
 * 테이블 첫 번째 행 클릭 후 networkidle 대기
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>} 행이 있으면 true
 */
export async function clickFirstRow(page) {
    const firstRow = page.locator('table tbody tr').first();
    if (!await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) return false;
    await firstRow.click();
    await page.waitForLoadState('networkidle');
    return true;
}

/**
 * 테이블 n번째 행(0-based) 클릭
 * @param {import('@playwright/test').Page} page
 * @param {number} index 0-based
 * @returns {Promise<boolean>} 행이 있으면 true
 */
export async function clickRowAt(page, index) {
    const row = page.locator('table tbody tr').nth(index);
    if (!await row.isVisible({ timeout: 5000 }).catch(() => false)) return false;
    await row.click();
    await page.waitForLoadState('networkidle');
    return true;
}
