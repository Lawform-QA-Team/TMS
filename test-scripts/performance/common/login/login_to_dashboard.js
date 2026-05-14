import { getFormattedTimestamp } from "@tms/performance/common/utils.js";

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
    const email = (typeof __ENV !== 'undefined' && __ENV.LOGIN_EMAIL)
        ? __ENV.LOGIN_EMAIL
        : (typeof process !== 'undefined' ? process.env.LOGIN_EMAIL : null);
    const password = (typeof __ENV !== 'undefined' && __ENV.LOGIN_PASSWORD)
        ? __ENV.LOGIN_PASSWORD
        : (typeof process !== 'undefined' ? process.env.LOGIN_PASSWORD : null);

    await page.goto(`${BASE_URL}`);
    await page.screenshot({ path: `screenshots/${getFormattedTimestamp().replace(/:/g, '_')}_home.png` });

    await page.goto(`${BASE_URL}/login`);
    await page.screenshot({ path: `screenshots/${getFormattedTimestamp().replace(/:/g, '_')}_login.png` });

    await page.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT);
    await page.type(SELECTORS.LOGIN.EMAIL_INPUT, email);

    await page.waitForSelector(SELECTORS.LOGIN.PASSWORD_INPUT);
    await page.type(SELECTORS.LOGIN.PASSWORD_INPUT, password);

    await page.click(SELECTORS.LOGIN.SUBMIT_BUTTON);

    await page.goto(`${BASE_URL}/dashboard`);
    await page.screenshot({ path: `screenshots/${getFormattedTimestamp().replace(/:/g, '_')}_dashboard.png` });
}
