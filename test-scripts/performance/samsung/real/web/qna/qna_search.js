import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { browser } from 'k6/browser';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { SELECTORS } from '../../selector_sam.js';
import { URLS } from '../../url_base_sam.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

export const options = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            vus: 1,
            iterations: 1,
            options: {
                browser: {
                    type: 'chromium',
                },
            },
        },
    },
    thresholds: {
        checks: ['rate==1.0'],
    },
};

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function() {
    const page = await browser.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);
        await wait(3000);
        const timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_login_success.png` });
        
        await page.goto(URLS.SERVICE.QNA);
        await page.waitForLoadState('load');
        await wait(5000);
        console.log('QNA URL:', await page.url());
        await page.screenshot({ path: `screenshots/${timestamp}_qna.png` });

        await page.waitForSelector(SELECTORS.COMMON.TABLE);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        await page.screenshot({ path: `screenshots/${timestamp}_qna_table.png` });

        await page.goto(URLS.SERVICE.QNA);
        await page.waitForLoadState('load');

        await page.waitForSelector(SELECTORS.COMMON.PAGE_LAST);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        await page.screenshot({ path: `screenshots/${timestamp}_qna_page_last.png` });

        
        await page.waitForSelector(SELECTORS.COMMON.PAGE_FIRST);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);
        await wait(5000);
        await page.screenshot({ path: `screenshots/${timestamp}_qna_page_first.png` });

        
    } finally {
        await page.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
    return {
        [`Result/logout_${timestamp}.html`]: htmlReport(data),
    };
}