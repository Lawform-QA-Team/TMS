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

        // 재무 검토 여부에 따른 분기
        if (__ENV.FINANCE_REVIEW !== 'use') {
            console.log('재무 검토 없음 - 건너뜀');
            return;
        }

        // 재무 검토 목록 진입
        await page.goto(URLS.CLM.REVIEW);
        let timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_finance_review_list.png` });

        // 재무 검토 중인 계약 항목 클릭
        await page.waitForSelector(CLM.FIRST_ROW);
        await page.locator(CLM.FIRST_ROW).click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_finance_review_detail.png` });

        // 재무 검토 완료 처리
        await page.waitForSelector(CLM.COMPLETE_REVIEW_BUTTON);
        await page.locator(CLM.COMPLETE_REVIEW_BUTTON).click();
        await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
        await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_finance_review_done.png` });
    } finally {
        if (page) await page.close();
    }
}
