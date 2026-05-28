/**
 * CLM 인감 사용 신청 - Playwright용
 * 플로우: 인감 사용 신청 중 (전자서명/직접서명 시 인감 사용 요청)
 */
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { getFormattedTimestamp, wait } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../login/login_helper.js';
import { clickFooterConfirm } from '../../util/helpers.js';

const CLM = SELECTORS.BUSINESS.CLM;

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // 인감 사용 신청 중
    await page.goto(URLS.CLM.REVIEW);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_seal_list.png` });

    await page.waitForSelector(CLM.FIRST_ROW);
    await page.locator(CLM.FIRST_ROW).click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_seal_detail.png` });

    // 인감 사용 신청 버튼 클릭
    await page.waitForSelector(CLM.BUTTON_RECIPIENT);
    await page.locator(CLM.BUTTON_RECIPIENT).click();
    await clickFooterConfirm(page);
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_seal_requested.png` });
}
