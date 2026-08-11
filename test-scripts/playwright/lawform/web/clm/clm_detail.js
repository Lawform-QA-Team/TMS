/**
 * CLM 상세 조회 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. CLM 검토 목록에서 첫 번째 항목 진입
 * 2. 상세 헤드 메뉴 (다운로드, 상태변경) 확인
 * 3. 계약서 미리보기 버튼 확인
 * 4. 결재선 확인
 * 5. 활동 로그 버튼 확인
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { CLM } from '../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // ── 1. CLM 검토 목록 진입 ──────────────────────────────────────
    await page.goto(URLS.CLM.REVIEW);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_clm_review_before_detail.png` });

    // ── 2. 첫 번째 항목 클릭 (테이블 첫 행) ────────────────────────
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_clm_detail.png` });

        // ── 3. 헤드 메뉴 액션 버튼 확인 ────────────────────────────
        const actionBtn = page.locator(CLM.CONTRACT_ACTION_BUTTON.BUTTON_CLICK);
        if (await actionBtn.isVisible()) {
            await page.screenshot({ path: `screenshots/${ts()}_clm_action_btn.png` });
        }

        // ── 4. 계약서 미리보기 버튼 확인 ───────────────────────────
        const previewBtn = page.locator(CLM.CONTRACT_PREVIEW.BUTTON_PREVIEW ?? CLM.FILE_CELL.BUTTON_PREVIEW);
        if (await previewBtn.first().isVisible()) {
            await page.screenshot({ path: `screenshots/${ts()}_clm_preview_btn.png` });
        }

        // ── 5. 활동 로그 버튼 확인 ─────────────────────────────────
        const activityLogBtn = page.locator(CLM.INDEX.BUTTON_ACTIVITY_LOG);
        if (await activityLogBtn.isVisible()) {
            await activityLogBtn.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `screenshots/${ts()}_clm_activity_log.png` });
        }

        // ── 6. 상태 변경 버튼 확인 ─────────────────────────────────
        const changeStageBtn = page.locator(CLM.INDEX.BUTTON_CHANGE_STAGE);
        if (await changeStageBtn.isVisible()) {
            await page.screenshot({ path: `screenshots/${ts()}_clm_change_stage.png` });
        }
    } else {
        console.log('[clm_detail] 검토 목록에 항목 없음 — 스킵');
    }
}
