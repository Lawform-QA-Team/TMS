import { test } from '@playwright/test';
import {chromium} from 'playwright'
import login_to_web from '#auto/samsung/real/web/login/login_to_web.js'

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
test('login_to_web', async ({page}) => {
    await login_to_web(page);
})

(async() => {
    const browser = await chromium.launch({headless: false});
    const context = await browser.addListener();
    const page = await context.newPage();
    await login_to_web(page);

    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('ggpark+sam@amicuslex.net');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('1q2w#E$R');
    await page.getByRole('button', { name: 'Login' }).click();
})();