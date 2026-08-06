import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { browser } from 'k6/browser';
import { URLS } from '../../util/url_base_hsad.js';
import { SELECTORS } from '../../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard } from '../../common/k6_browser_helpers.js';
import { getFormattedTimestamp } from "@tms/performance/common/utils.js";
import clm_draft from './clm_draft.js';

export const options = hsadBrowserOptions;

const CLM = SELECTORS.BUSINESS.CLM;

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function () {
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');
    let page;
    try {
        page = await clm_draft();

        let timestamp = getNewTimestamp();

        // 내부 결재선 여부에 따른 분기
        if (__ENV.INTERNAL_APPROVAL === 'use') {
            // 내부 결재 중 - 내부 결재자가 결재 처리
            await page.goto(URLS.CLM.REVIEW);
            await page.waitForSelector(CLM.FIRST_ROW);
            await page.locator(CLM.FIRST_ROW).click();
            timestamp = getNewTimestamp();
            await page.screenshot({ path: `screenshots/${timestamp}_internal_approval.png` });

            await page.waitForSelector(CLM.BUTTON_APPROVAL);
            await page.locator(CLM.BUTTON_APPROVAL).click();
            await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
            await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
            await wait(3000);
            timestamp = getNewTimestamp();
            await page.screenshot({ path: `screenshots/${timestamp}_internal_approval_done.png` });
        }

        // 담당자 배정 중
        await page.goto(URLS.CLM.REVIEW);
        await page.waitForSelector(CLM.FIRST_ROW);
        await page.locator(CLM.FIRST_ROW).click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_before_assign.png` });

        await page.waitForSelector(CLM.ASSIGN_BUTTON);
        await page.locator(CLM.ASSIGN_BUTTON).click();
        await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
        await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_assigned.png` });

        // 법무 검토 목록 진입 확인
        await page.goto(URLS.CLM.REVIEW);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_legal_review_list.png` });
    } finally {
        if (page) await page.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/:/g, '_');
    return {
        [`Result/clm_process_summary_${timestamp}.html`]: htmlReport(data),
    };
}
