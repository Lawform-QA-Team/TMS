import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';

/**
 * 환경변수에서 로그인 계정 반환
 * k6: __ENV.LOGIN_EMAIL / Playwright: process.env.LOGIN_EMAIL 또는 .env
 */
export function getCredentials() {
    const email =
        (typeof __ENV !== 'undefined' && (__ENV.LOGIN_EMAIL || __ENV.EMAIL)) ||
        (typeof process !== 'undefined' && (process.env?.LOGIN_EMAIL || process.env?.EMAIL)) ||
        '';
    const password =
        (typeof __ENV !== 'undefined' && (__ENV.LOGIN_PASSWORD || __ENV.PASSWORD)) ||
        (typeof process !== 'undefined' &&
            (process.env?.LOGIN_PASSWORD || process.env?.PASSWORD)) ||
        '';
    if (!email || !password) {
        throw new Error(
            '로그인 계정 필요. .env에 LOGIN_EMAIL, LOGIN_PASSWORD 설정 또는 환경변수 지정'
        );
    }
    return { EMAIL: email, PASSWORD: password };
}

/**
 * 주어진 page에 로그인 수행 (스크린샷 포함).
 * 각 스크립트에서 page = await browser.newPage() 후 호출.
 */
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function loginWithPage(page, credentials) {
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    await page.goto(URLS.LOGIN.HOME);
    let timestamp = getNewTimeStamp();
    await page.screenshot({ path: `screenshots/${timestamp}_login_home.png` });

    await page.waitForSelector(SELECTORS.FEATURES.LOGIN.INPUT_EMAIL);
    await page.locator(SELECTORS.FEATURES.LOGIN.INPUT_EMAIL).fill(credentials.EMAIL);
    await page.waitForSelector(SELECTORS.FEATURES.LOGIN.INPUT_PASSWORD);
    await page.locator(SELECTORS.FEATURES.LOGIN.INPUT_PASSWORD).fill(credentials.PASSWORD);

    timestamp = getNewTimeStamp();
    await page.screenshot({ path: `screenshots/${timestamp}_input_account.png` });

    await page.waitForSelector(SELECTORS.FEATURES.LOGIN.BUTTON_SUBMIT);
    await page.click(SELECTORS.FEATURES.LOGIN.BUTTON_SUBMIT);
    await wait(2000);
}
