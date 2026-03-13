import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';

/**
 * k6 환경변수에서 웹 서비스 로그인 계정 반환 (WEB_LOGIN_EMAIL, WEB_LOGIN_PASSWORD)
 */
export function getCredentials() {
    const email = (typeof __ENV !== 'undefined' && (__ENV.WEB_LOGIN_EMAIL || __ENV.LOGIN_EMAIL || __ENV.EMAIL)) || '';
    const password = (typeof __ENV !== 'undefined' && (__ENV.WEB_LOGIN_PASSWORD || __ENV.LOGIN_PASSWORD || __ENV.PASSWORD)) || '';
    if (!email || !password) {
        throw new Error('로그인 계정 필요. k6 실행 시 -e WEB_LOGIN_EMAIL=... -e WEB_LOGIN_PASSWORD=... 스크립트경로');
    }
    console.log('EMAIL:', email);
    console.log('PASSWORD:', password);
    return { EMAIL: email, PASSWORD: password };
}

/**
 * 주어진 page에 웹 서비스 로그인 수행 (스크린샷 포함).
 */
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function loginWithPage(page, credentials) {
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    await page.goto(URLS.WEB_LOGIN.HOME);
    let timestamp = getNewTimeStamp();
    await page.screenshot({ path: `screenshots/${timestamp}_login_home.png` });

    await page.waitForSelector(SELECTORS.FEATURES.LOGIN.INPUT_EMAIL);
    await page.type(SELECTORS.FEATURES.LOGIN.INPUT_EMAIL, credentials.EMAIL);
    await page.waitForSelector(SELECTORS.FEATURES.LOGIN.INPUT_PASSWORD);
    await page.type(SELECTORS.FEATURES.LOGIN.INPUT_PASSWORD, credentials.PASSWORD);

    timestamp = getNewTimeStamp();
    await page.screenshot({ path: `screenshots/${timestamp}_input_account.png` });

    await page.waitForSelector(SELECTORS.FEATURES.LOGIN.BUTTON_SUBMIT);
    await page.click(SELECTORS.FEATURES.LOGIN.BUTTON_SUBMIT);
    await wait(2000);
}
