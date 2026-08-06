import { getFormattedTimestamp } from "@tms/performance/common/utils.js";
import { browser } from 'k6/browser';

// BASE_URL: k6 실행 시 -e BASE_URL=... 또는 process.env.BASE_URL
let BASE_URL;
if (typeof __ENV !== 'undefined' && __ENV.BASE_URL) {
    BASE_URL = __ENV.BASE_URL.replace(/\/$/, '');
} else if (typeof process !== 'undefined' && process.env && process.env.BASE_URL) {
    BASE_URL = process.env.BASE_URL.replace(/\/$/, '');
}

const SELECTORS = {
    LOGIN: {
        EMAIL_INPUT: 'input[id="email"]',
        PASSWORD_INPUT: 'input[id="password"]',
        SUBMIT_BUTTON: 'button[type="submit"]',
    }
};

export default async function login_to_dashboard(page) {
    const loginPage = page || await browser.newPage();
    const email = (typeof __ENV !== 'undefined' && __ENV.LOGIN_EMAIL)
        ? __ENV.LOGIN_EMAIL
        : (typeof process !== 'undefined' ? process.env.LOGIN_EMAIL : null);
    const password = (typeof __ENV !== 'undefined' && __ENV.LOGIN_PASSWORD)
        ? __ENV.LOGIN_PASSWORD
        : (typeof process !== 'undefined' ? process.env.LOGIN_PASSWORD : null);

    if (!BASE_URL) {
        throw new Error('BASE_URL 환경변수가 필요합니다.');
    }
    if (!email || !password) {
        throw new Error('LOGIN_EMAIL / LOGIN_PASSWORD 환경변수가 필요합니다.');
    }

    await loginPage.goto(`${BASE_URL}`);
    await loginPage.screenshot({ path: `screenshots/${getFormattedTimestamp().replace(/:/g, '_')}_home.png` });

    await loginPage.goto(`${BASE_URL}/login`);
    await loginPage.screenshot({ path: `screenshots/${getFormattedTimestamp().replace(/:/g, '_')}_login.png` });

    await loginPage.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT);
    await loginPage.type(SELECTORS.LOGIN.EMAIL_INPUT, email);

    await loginPage.waitForSelector(SELECTORS.LOGIN.PASSWORD_INPUT);
    await loginPage.type(SELECTORS.LOGIN.PASSWORD_INPUT, password);

    await loginPage.click(SELECTORS.LOGIN.SUBMIT_BUTTON);
    await loginPage.waitForURL(`${BASE_URL}/dashboard`);

    await loginPage.screenshot({ path: `screenshots/${getFormattedTimestamp().replace(/:/g, '_')}_dashboard.png` });
    return loginPage;
}
