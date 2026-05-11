/**
 * GNB (Global Navigation Bar) 클릭 테스트 - Playwright용
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    await page.goto(URLS.LOGIN.DASHBOARD);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_dashboard.png` });

    // TODO: GNB 네비게이션 클릭 플로우 구현
}
