/**
 * [Action] 공통 — 테이블 조작
 */

/**
 * 테이블에 행이 있는지 확인
 * @param {import('k6/browser').Page} page
 */
export async function hasRows(page) {
    const firstRow = page.locator('table tbody tr').first();
    return await firstRow.isVisible();
}

/**
 * 테이블 첫 번째 행 클릭 후 networkidle 대기
 * @param {import('k6/browser').Page} page
 * @returns {Promise<boolean>} 행이 있으면 true
 */
export async function clickFirstRow(page) {
    const firstRow = page.locator('table tbody tr').first();
    if (!await firstRow.isVisible()) return false;
    await firstRow.click();
    await page.waitForLoadState('networkidle');
    return true;
}

/**
 * 테이블 n번째 행(0-based) 클릭
 * @param {import('k6/browser').Page} page
 * @param {number} index
 */
export async function clickRowAt(page, index) {
    const rows = page.locator('table tbody tr');
    const row = rows.nth(index);
    if (!await row.isVisible()) return false;
    await row.click();
    await page.waitForLoadState('networkidle');
    return true;
}
