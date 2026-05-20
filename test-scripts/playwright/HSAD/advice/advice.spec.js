import { test, expect } from '@playwright/test';
import { login } from '../common/auth';

test.describe('HSAD Legal Advice', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('LC_002: Advice Menu Visibility', async ({ page }) => {
        await expect(page.locator('nav').getByText('법률 자문')).toBeVisible();
    });
});
