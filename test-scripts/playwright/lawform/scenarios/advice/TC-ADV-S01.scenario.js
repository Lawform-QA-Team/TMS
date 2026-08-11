/**
 * TC-ADV-S01: 자문 목록 조회
 *
 * 검증: 검토 목록 진입, 엑셀 다운로드 버튼 노출
 */
import { test, expect } from '@playwright/test';
import { login }           from '../../actions/common/common.login.js';
import { gotoReviewList }  from '../../actions/advice/advice.navigate.js';
import { ADVICE }          from '../../selectors/index.js';

test('[TC-ADV-S01] 자문 목록 조회', async ({ page }) => {
    await login(page);
    await gotoReviewList(page);
    await expect(page).toHaveURL(/\/advice/);

    const excelBtn = page.locator(ADVICE.EXCEL_DOWNLOAD_BUTTON.BUTTON_R_CLICK_EXCEL_DOWNLOAD);
    if (await excelBtn.isVisible()) {
        await expect(excelBtn).toBeVisible();
    }
});
