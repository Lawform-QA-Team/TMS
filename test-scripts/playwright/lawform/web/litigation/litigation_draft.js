/**
 * 송무 등록 - Playwright용
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    await page.goto(URLS.LITIGATION.DRAFT);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_litigation_draft.png` });

    await page.waitForSelector('//button[text()="신규 송무 등록" and not(@disabled)]');
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_before_request.png` });
    await page.locator('//button[text()="신규 송무 등록"]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_after_request.png` });

    // TODO: 신규 송무 등록 폼 입력 구현
}
