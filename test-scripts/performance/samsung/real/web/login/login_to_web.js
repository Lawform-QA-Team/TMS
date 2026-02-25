import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS, SELECTORS } from '../../../../url/url_base.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';

function getCredentials() {
    const email = (typeof __ENV !== 'undefined' && (__ENV.LOGIN_EMAIL || __ENV.EMAIL)) || '';
    const password = (typeof __ENV !== 'undefined' && (__ENV.LOGIN_PASSWORD || __ENV.PASSWORD)) || '';
    if (!email || !password) {
        throw new Error('로그인 계정 필요. k6 실행 시 -e LOGIN_EMAIL=... -e LOGIN_PASSWORD=... 또는 -e EMAIL=... -e PASSWORD=...');
    }
    return { EMAIL: email, PASSWORD: password };
}

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