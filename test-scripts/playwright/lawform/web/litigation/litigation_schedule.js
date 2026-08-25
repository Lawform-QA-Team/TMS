/**
 * 송무 일정 추가 / 조회 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 송무 목록 → 첫 번째 항목 상세 진입
 * 2. 일정 탭 또는 일정 섹션 이동
 * 3. 일정 추가 버튼 클릭 (SCHEDULE_ACTION=add)
 * 4. 일정 목록 스크린샷
 *
 * ENV:
 *   SCHEDULE_ACTION = add | view  (default: view)
 *   LITIGATION_ID   = 소송 ID (지정 시 해당 URL로 직접 진입)
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { LITIGATION } from '../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');
    const scheduleAction = process.env.SCHEDULE_ACTION ?? 'view';
    const litigationId = process.env.LITIGATION_ID;

    await loginWithPage(page, credentials);

    // ── 1. 송무 상세 진입 ─────────────────────────────────────────────
    if (litigationId) {
        await page.goto(`${URLS.LITIGATION.REVIEW}/${litigationId}`);
        await page.waitForLoadState('networkidle');
    } else {
        await page.goto(URLS.LITIGATION.REVIEW);
        await page.waitForLoadState('networkidle');

        const firstRow = page.locator('table tbody tr').first();
        if (!await firstRow.isVisible()) {
            console.log('[litigation_schedule] 송무 목록에 항목 없음 — 스킵');
            return;
        }
        await firstRow.click();
        await page.waitForLoadState('networkidle');
    }
    await page.screenshot({ path: `screenshots/${ts()}_litigation_schedule_detail.png` });

    // ── 2. 일정 탭 이동 ──────────────────────────────────────────────
    const scheduleTab = page.locator('button:has-text("일정"), [role="tab"]:has-text("일정")').first();
    if (await scheduleTab.isVisible()) {
        await scheduleTab.click();
        await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `screenshots/${ts()}_litigation_schedule_list.png` });

    // ── 3. 일정 추가 ─────────────────────────────────────────────────
    if (scheduleAction === 'add') {
        const addBtn = page.locator('button:has-text("일정 추가"), button:has-text("추가")').first();
        if (await addBtn.isVisible()) {
            await addBtn.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: `screenshots/${ts()}_litigation_schedule_add_modal.png` });

            const confirmBtn = page.locator('button:has-text("저장"), button:has-text("확인")').last();
            if (await confirmBtn.isVisible()) {
                // 실제 저장은 생략, 스크린샷 후 취소
                const cancelBtn = page.locator('button:has-text("취소")').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                }
            }
        } else {
            console.log('[litigation_schedule] 일정 추가 버튼 없음');
        }
    }
}
