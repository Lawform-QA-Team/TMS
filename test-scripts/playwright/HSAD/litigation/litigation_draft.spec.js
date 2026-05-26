import { test, expect } from '@playwright/test';
import { login } from '../common/auth.js';

test.describe('HSAD Litigation - LC Cases', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('LC_001~LC_002: Menu Tree', async ({ page }) => {
        const litigationMenu = page.locator('nav').getByText('송무');
        await expect(litigationMenu).toBeVisible();

        await litigationMenu.click();
        await expect(page.getByText('송무 등록')).toBeVisible();
        await expect(page.getByText('송무 조회')).toBeVisible();
        await expect(page.getByText('송무 전체 일정')).toBeVisible();
    });
});
