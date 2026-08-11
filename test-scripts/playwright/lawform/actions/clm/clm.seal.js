/**
 * CLM 인감 날인 액션
 *
 * progress_status = 6 (FINAL_APPROVAL) 단계
 */
import { URLS } from '../../url_base_lawform.js';
import { hasRows, clickFirstRow } from '../common/common.table.js';

/** CLM 상세에서 인감사용 신청 버튼 클릭 + 확인 */
export async function requestSeal(page) {
    const btn = page.locator('button:has-text("인감사용 신청")').first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 인감 검토 목록으로 이동 후 첫 번째 항목에서 승인 */
export async function approveSeal(page) {
    await page.goto(URLS.SEAL.REVIEW);
    await page.waitForLoadState('networkidle');
    if (!await hasRows(page)) throw new Error('[SEAL] 인감 검토 목록에 항목 없음');
    await clickFirstRow(page);
    const approveBtn = page.locator('button:has-text("승인")').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 인감 검토 목록에서 반려 */
export async function denySeal(page, reason = '자동화 테스트 인감 반려') {
    await page.goto(URLS.SEAL.REVIEW);
    await page.waitForLoadState('networkidle');
    if (!await hasRows(page)) throw new Error('[SEAL] 인감 검토 목록에 항목 없음');
    await clickFirstRow(page);
    const denyBtn = page.locator('button:has-text("반려")').first();
    await denyBtn.waitFor({ state: 'visible', timeout: 10000 });
    await denyBtn.click();
    await page.waitForTimeout(500);
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) await textarea.fill(reason);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}
