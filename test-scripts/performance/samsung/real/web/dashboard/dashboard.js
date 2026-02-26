import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../../../url/url_base_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
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

        await page.goto(URLS.DASHBOARD.HOME);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_dashboard_home.png` });
    } finally {
        await page.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
    return {
        [`Result/dashboard_${timestamp}.html`]: htmlReport(data),
    };
}