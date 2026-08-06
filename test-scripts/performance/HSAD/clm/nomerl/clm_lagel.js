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

export default async function () {
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');
    let page;
    try {
        const context = await browser.newContext();
        page = await context.newPage();
        await loginToDashboard(page, URLS, SELECTORS);

        // 법무 검토 목록 진입
        await page.goto(URLS.CLM.REVIEW);
        let timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_legal_review_list.png` });

        // 법무 검토 중인 계약 항목 클릭
        await page.waitForSelector(CLM.FIRST_ROW);
        await page.locator(CLM.FIRST_ROW).click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_legal_review_detail.png` });

        if (__ENV.REQUESTER_REVIEW === 'use') {
            // 요청자에게 재검토 요청
            await page.waitForSelector(CLM.RESEND_TO_DEPARTMENT_BUTTON);
            await page.locator(CLM.RESEND_TO_DEPARTMENT_BUTTON).click();
            await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
            await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
            await wait(3000);
            timestamp = getNewTimestamp();
            await page.screenshot({ path: `screenshots/${timestamp}_requester_reviewing.png` });

            // 요청자 검토 완료 후 법무 검토 재진입
            await page.goto(URLS.CLM.REVIEW);
            await page.waitForSelector(CLM.FIRST_ROW);
            await page.locator(CLM.FIRST_ROW).click();
            timestamp = getNewTimestamp();
            await page.screenshot({ path: `screenshots/${timestamp}_legal_review_again.png` });
        }

        // 법무 검토 완료
        await page.waitForSelector(CLM.LEGAL_APPROVAL_BUTTON);
        await page.locator(CLM.LEGAL_APPROVAL_BUTTON).click();
        await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
        await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_legal_review_done.png` });
    } finally {
        if (page) await page.close();
    }
}
