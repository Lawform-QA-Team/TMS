import { browser } from 'k6/browser';
import { URLS } from '../../util/url_base_hsad.js';
import { SELECTORS } from '../../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard } from '../../common/k6_browser_helpers.js';
import { getFormattedTimestamp } from "@tms/performance/common/utils.js";
import { runSeal } from './clm_seal.js';

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

        // 서명 대상 계약 진입
        await page.goto(URLS.CLM.REVIEW);
        let timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_sign_list.png` });

        await page.waitForSelector(CLM.FIRST_ROW);
        await page.locator(CLM.FIRST_ROW).click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_sign_detail.png` });

        if (__ENV.SIGN_TYPE === 'esign') {
            // 전자서명 선택
            await page.waitForSelector(CLM.SELECT_ERP_ESIGN_LABEL);
            await page.locator(CLM.SELECT_ERP_ESIGN_LABEL).click();
            timestamp = getNewTimestamp();
            await page.screenshot({ path: `screenshots/${timestamp}_esign_selected.png` });

            await page.waitForSelector(CLM.START_BUTTON);
            await page.locator(CLM.START_BUTTON).click();
            await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
            await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
            await wait(3000);
            timestamp = getNewTimestamp();
            await page.screenshot({ path: `screenshots/${timestamp}_esign_started.png` });

            if (__ENV.SEAL_USE === 'use') {
                await runSeal(page);
            }
        } else {
            // 직접서명
            if (__ENV.SEAL_USE === 'use') {
                await runSeal(page);
            }
        }

        // 서본 등록 중
        await page.goto(URLS.CLM.REVIEW);
        await page.waitForSelector(CLM.FIRST_ROW);
        await page.locator(CLM.FIRST_ROW).click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_original_register.png` });

        await page.waitForSelector(CLM.SAVE_BUTTON);
        await page.locator(CLM.SAVE_BUTTON).click();
        await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
        await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_original_registered.png` });

        // 계약 이행 중
        await page.goto(URLS.CLM.COMPLETE);
        await page.waitForSelector(CLM.FIRST_ROW);
        await page.locator(CLM.FIRST_ROW).click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_contract_in_progress.png` });

        // 계약 종료
        await page.waitForSelector(CLM.DONE_DISUSE);
        await page.locator(CLM.DONE_DISUSE).click();
        await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
        await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_contract_done.png` });
    } finally {
        if (page) await page.close();
    }
}
