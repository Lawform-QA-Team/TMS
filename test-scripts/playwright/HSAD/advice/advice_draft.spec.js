import { test, expect } from '@playwright/test';
import { URLS } from '../util/url_base_hsad.js';
import { login } from '../common/auth';

test.describe('HSAD Advice - LC Cases', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('LC_002: Menu Visibility', async ({ page }) => {
        await expect(page.locator('nav').getByText('법률 자문')).toBeVisible();
    });

    test('LC_005~LC_007: Settings', async ({ page }) => {
        await page.goto(URLS.SETTING.SETUP);

        // LC_005: 법률 자문 관리 / 자문 분류 관리 메뉴 노출
        await expect(page.getByText('법률 자문 관리')).toBeVisible();
        await expect(page.getByText('자문 분류 관리')).toBeVisible();

        // LC_006: 법률 자문 관리 안내 문구 노출
        await expect(page.getByText('법률 자문 관리 옵션을 설정해보세요')).toBeVisible();

        // LC_007: 완료 권한 안내와 radio, 저장 버튼 노출
        await expect(page.getByText(/법률 자문.*완료.*권한/)).toBeVisible();
        for (const roleName of ['요청자', '자문 담당자', '요청자 또는 자문 담당자']) {
            await expect(page.getByText(roleName, { exact: true })).toBeVisible();
        }
        await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible();
    });
});
