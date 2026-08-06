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

        // 최종 결재 여부에 따른 분기
        if (__ENV.FINAL_APPROVAL !== 'use') {
            console.log('최종 결재 없음 - 건너뜀');
            return;
        }

        // 최종 결재 요청
        await page.goto(URLS.CLM.REVIEW);
        let timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_final_approval_list.png` });

        await page.waitForSelector(CLM.FIRST_ROW);
        await page.locator(CLM.FIRST_ROW).click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_final_approval_detail.png` });

        // 최종 결재 요청 버튼 클릭
        await page.waitForSelector(CLM.BUTTON_FINAL_APPROVAL_REQUEST);
        await page.locator(CLM.BUTTON_FINAL_APPROVAL_REQUEST).click();
        await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
        await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_final_approval_requested.png` });

        // 최종 결재 중 - 결재자가 결재 처리
        await page.goto(URLS.CLM.REVIEW);
        await page.waitForSelector(CLM.FIRST_ROW);
        await page.locator(CLM.FIRST_ROW).click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_final_approving.png` });

        await page.waitForSelector(CLM.BUTTON_APPROVAL);
        await page.locator(CLM.BUTTON_APPROVAL).click();
        await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
        await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_final_approval_done.png` });
    } finally {
        if (page) await page.close();
    }
}
