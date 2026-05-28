import { browser } from 'k6/browser';
import { URLS } from '../../util/url_base_hsad.js';
import { SELECTORS } from '../../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard } from '../../common/k6_browser_helpers.js';
import { getFormattedTimestamp } from "@tms/performance/common/utils.js";

export const options = hsadBrowserOptions;

const CLM = SELECTORS.BUSINESS.CLM;

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runSeal(page) {
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

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
    await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
    await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_seal_requested.png` });
}

export default async function () {
    let page;
    try {
        const context = await browser.newContext();
        page = await context.newPage();
        await loginToDashboard(page, URLS, SELECTORS);
        await runSeal(page);
    } finally {
        if (page) await page.close();
    }
}
