import { URLS, SELECTORS } from '../../../../url/url_base_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';

/**
 * k6 환경변수에서 로그인 계정 반환 (LOGIN_EMAIL/EMAIL, LOGIN_PASSWORD/PASSWORD)
 */
export function getCredentials() {
    const email = (typeof __ENV !== 'undefined' && (__ENV.LOGIN_EMAIL || __ENV.EMAIL)) || '';
    const password = (typeof __ENV !== 'undefined' && (__ENV.LOGIN_PASSWORD || __ENV.PASSWORD)) || '';
    if (!email || !password) {
        throw new Error('로그인 계정 필요. k6 실행 시 -e LOGIN_EMAIL=... -e LOGIN_PASSWORD=... 또는 -e EMAIL=... -e PASSWORD=...');
    }
    console.log('EMAIL:', email);
    console.log('PASSWORD:', password);
    return { EMAIL: email, PASSWORD: password };
}

/**
 * 주어진 page에 로그인 수행 (스크린샷 포함).
 * 각 스크립트에서 page = await browser.newPage() 후 호출.
 */
export async function loginWithPage(page, credentials) {
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    await page.goto(URLS.LOGIN.HOME);
    let timestamp = getNewTimeStamp();
    await page.screenshot({ path: `screenshots/${timestamp}_login_home.png` });

    await page.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT);
    await page.type(SELECTORS.LOGIN.EMAIL_INPUT, credentials.EMAIL);
    await page.waitForSelector(SELECTORS.LOGIN.PASSWORD_INPUT);
    await page.type(SELECTORS.LOGIN.PASSWORD_INPUT, credentials.PASSWORD);

    timestamp = getNewTimeStamp();
    await page.screenshot({ path: `screenshots/${timestamp}_input_account.png` });

    await page.waitForSelector(SELECTORS.LOGIN.SUBMIT_BUTTON);
    await page.click(SELECTORS.LOGIN.SUBMIT_BUTTON);
}
