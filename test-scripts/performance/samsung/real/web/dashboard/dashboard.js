import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS, SELECTORS } from '../../../../url/url_base_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import login_to_web from '../login/login_to_web.js';

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
        // 로그인 페이지 처리
        await login_to_web(page);
        await page.goto (URLS.DASHBOARD.HOME);
        let timestamp = getNewTimeStamp();
        await page.screenshot({path: `screenshots/${timestamp}_dashboard_home.png`});

    }
    finally {
        await page.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
    return {
        [`Result/dashboard_${timestamp}.html`]: htmlReport(data),
    };
}