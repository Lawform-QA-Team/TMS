import { expect } from '@playwright/test';
import { URLS, SELECTORS } from '../util/url_base_hsad.js';
import { getCredentials } from '../login/login_helper.js';

export async function login(page) {
    const credentials = getCredentials();

    await page.goto(URLS.LOGIN.LOGIN);
    await page.fill(SELECTORS.LOGIN.EMAIL_INPUT, credentials.EMAIL);
    await page.fill(SELECTORS.LOGIN.PASSWORD_INPUT, credentials.PASSWORD);
    await page.click(SELECTORS.LOGIN.SUBMIT_BUTTON);
    await expect(page).toHaveURL(/.*dashboard/);
}
