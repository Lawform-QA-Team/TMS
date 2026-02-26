import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { browser } from 'k6/browser';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { SELECTORS } from '../../../../url/url_base_sam.js';
import { getCredentials, loginWithPage } from './login_helper.js';

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
        const timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_login_success.png` });
        console.log('URL:', await page.url());
        await page.locator(SELECTORS.LOGIN.LOGOUT).waitFor({ state: 'visible' });
        await page.locator(SELECTORS.LOGIN.LOGOUT).click();
        const timestampAfter = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestampAfter}_logout_success.png` });

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