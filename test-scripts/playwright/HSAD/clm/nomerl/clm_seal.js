/**
 * CLM 인감 사용 신청 - Playwright용
 * 플로우: 인감 사용 신청 중 (전자서명/직접서명 시 인감 사용 요청)
 */
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../login/login_helper.js';

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

    // 인감 사용 신청 중
    await page.goto(URLS.CLM.REVIEW);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_seal_list.png` });

    await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
    await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_seal_detail.png` });

    // 인감 사용 신청 버튼 클릭
    await page.waitForSelector(SELECTORS.BUSINESS.CLM.BUTTON_RECIPIENT);
    await page.locator(SELECTORS.BUSINESS.CLM.BUTTON_RECIPIENT).click();
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_seal_requested.png` });
}
