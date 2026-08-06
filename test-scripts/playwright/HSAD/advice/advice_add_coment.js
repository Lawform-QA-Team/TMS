/**
 * 법률 자문 코멘트 추가 - Playwright용
 */
import { URLS } from '../util/url_base_hsad.js';
import { getFormattedTimestamp } from '../util/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    await page.goto(URLS.ADVICE.REVIEW);
    console.log(`URL: ${URLS.ADVICE.REVIEW}`);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_advice_review.png` });

    // TODO: 코멘트 추가 플로우 구현
}
