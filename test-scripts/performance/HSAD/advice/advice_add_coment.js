import { browser } from 'k6/browser';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard } from '../common/k6_browser_helpers.js';
import { getFormattedTimestamp } from "@tms/performance/common/utils.js";

export const options = hsadBrowserOptions;

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
        await page.goto(URLS.ADVICE.REVIEW);
        console.log(`URL: ${URLS.ADVICE.REVIEW}`);
        let timestamp = getNewTimestamp();
        await page.screenshot({path: `screenshots/${timestamp}_advice_review.png`});

    }
    finally {
        if (page) await page.close();
    }
}

