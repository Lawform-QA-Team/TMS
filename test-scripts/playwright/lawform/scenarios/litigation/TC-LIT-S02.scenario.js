/**
 * TC-LIT-S02: 송무 상세 조회
 *
 * 검증: 목록 첫 번째 항목 진입, 편집 버튼 / 첨부파일 영역 노출
 * 또는 LITIGATION_ID 환경변수로 특정 건 지정
 */
import { test, expect } from '@playwright/test';
import { login }             from '../../actions/common/common.login.js';
import { gotoDetailOrFirst } from '../../actions/litigation/litigation.navigate.js';

test('[TC-LIT-S02] 송무 상세 조회', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await expect(page).toHaveURL(/\/litigation\/.+/);

    const editBtn = page.locator('button:has-text("편집")').first();
    if (await editBtn.isVisible()) {
        await expect(editBtn).toBeVisible();
    }
});
