/**
 * 법률 자문 요청 - Playwright용
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    await page.goto(URLS.ADVICE.DRAFT);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_advice_draft.png` });

    await page.waitForSelector('//button[text()="신규 자문 요청" and not(@disabled)]');
    await page.locator('//button[text()="신규 자문 요청"]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_after_request.png` });

    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인" and not(@disabled)]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    timestamp = getNewTimestamp();
    await wait(10000);
    await page.screenshot({ path: `screenshots/${timestamp}_after_confirm.png` });

    await page.waitForSelector('//img[@alt="arrow"]');
    await page.locator('//img[@alt="arrow"]').click();

    const adviceType = process.env.ADVICE_TYPE;
    if (!adviceType) {
        console.log('ADVICE_TYPE 환경변수 필요');
    }
    // TODO: 자문 분류 선택 로직 구현 (pi, cn, ft, ma, ci, tl, la, hr, cole, overle, etc)
}
