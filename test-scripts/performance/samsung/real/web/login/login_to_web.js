import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS, SELECTORS } from '@performance/url/url_base';
import { getFormattedTimestamp } from '@performance/common/utils';
import { browser } from 'k6/browser';
import getCurrentLoginCredentials from '@performance/Account/Account_env'

export const options = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            options: {
                vus: 1,
                iterations: 1,
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
    const credentials = getCurrentLoginCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await page.goto (URLS.LOGIN.HOME);
        let timestamp = getNewTimeStamp();
        await page.screenshot({path: `screenshots/${timestamp}_login_home.png`});
        await page.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT);
        await page.type(SELECTORS.LOGIN.EMAIL_INPUT, credentials.EMAIL);
        await page.waitForSelector(SELECTORS.LOGIN.PASSWORD_INPUT);
        await page.type(SELECTORS.LOGIN.PASSWORD_INPUT, credentials.PASSWORD);
        timestamp = getNewTimeStamp();
        await page.screenshot({path: `screenshots/${timestamp}_input_account.png`});
        await page.waitForSelector(SELECTORS.LOGIN.SUBMIT_BUTTON);
        await page.click(SELECTORS.LOGIN.SUBMIT_BUTTON);

    }
    finally {
        await page.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
    return {
        [`Result/login_to_web_${timestamp}.html`]: htmlReport(data),
    };
}