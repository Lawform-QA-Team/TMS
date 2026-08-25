import { browser } from 'k6/browser';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard } from '../common/k6_browser_helpers.js';
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

        // 임시저장 리스트 진입
        await page.goto(URLS.CLM.DRAFT);
        await page.waitForSelector(CLM.NEW_REVIEW_REQUEST_BUTTON);
        let timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_blacklist_draft_list.png` });

        // 신규 검토 요청 클릭
        await page.locator(CLM.NEW_REVIEW_REQUEST_BUTTON).click();
        await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
        await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
        await wait(5000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_blacklist_draft_form.png` });

        if (__ENV.BLACKLIST_TEST !== 'true') {
            // 블랙리스트 차단 팝업 노출 확인만 수행
            timestamp = getNewTimestamp();
            await page.screenshot({ path: `screenshots/${timestamp}_blacklist_check_done.png` });
            return;
        }

        // 블랙리스트 차단 팝업: 동의 체크 후 특별 승인 요청
        const agreeCheckbox = page.locator('input[type="checkbox"]').last();
        if (await agreeCheckbox.isVisible()) {
            await agreeCheckbox.check();
            timestamp = getNewTimestamp();
            await page.screenshot({ path: `screenshots/${timestamp}_blacklist_agreed.png` });

            // 특별 승인 요청 버튼 클릭
            await page.waitForSelector(CLM.BLACKLIST_SPECIAL_APPROVE_BUTTON);
            await page.locator(CLM.BLACKLIST_SPECIAL_APPROVE_BUTTON).click();
            await wait(5000);
            timestamp = getNewTimestamp();
            await page.screenshot({ path: `screenshots/${timestamp}_blacklist_approval_requested.png` });
        }
    } finally {
        if (page) await page.close();
    }
}
