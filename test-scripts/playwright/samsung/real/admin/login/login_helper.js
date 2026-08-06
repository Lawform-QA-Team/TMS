import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';

/**
 * 환경변수에서 어드민 로그인 계정 반환
 * ADMIN_LOGIN_EMAIL → LOGIN_EMAIL → EMAIL 순으로 우선 적용
 */
export function getCredentials() {
    const email =
        (typeof __ENV !== 'undefined' && (__ENV.ADMIN_LOGIN_EMAIL || __ENV.LOGIN_EMAIL || __ENV.EMAIL)) ||
        (typeof process !== 'undefined' && (process.env?.ADMIN_LOGIN_EMAIL || process.env?.LOGIN_EMAIL || process.env?.EMAIL)) ||
        '';
    const password =
        (typeof __ENV !== 'undefined' && (__ENV.ADMIN_LOGIN_PASSWORD || __ENV.LOGIN_PASSWORD || __ENV.PASSWORD)) ||
        (typeof process !== 'undefined' &&
            (process.env?.ADMIN_LOGIN_PASSWORD || process.env?.LOGIN_PASSWORD || process.env?.PASSWORD)) ||
        '';
    if (!email || !password) {
        throw new Error(
            '로그인 계정 필요. .env에 ADMIN_LOGIN_EMAIL, LOGIN_PASSWORD 설정 또는 환경변수 지정'
        );
    }
    return { EMAIL: email, PASSWORD: password };
}

/**
 * 환경변수에서 웹(서비스) 로그인 계정 반환
 * WEB_LOGIN_EMAIL → LOGIN_EMAIL → EMAIL 순으로 우선 적용
 */
export function getWebCredentials() {
    const email =
        (typeof __ENV !== 'undefined' && (__ENV.WEB_LOGIN_EMAIL || __ENV.LOGIN_EMAIL || __ENV.EMAIL)) ||
        (typeof process !== 'undefined' && (process.env?.WEB_LOGIN_EMAIL || process.env?.LOGIN_EMAIL || process.env?.EMAIL)) ||
        '';
    const password =
        (typeof __ENV !== 'undefined' && (__ENV.WEB_LOGIN_PASSWORD || __ENV.LOGIN_PASSWORD || __ENV.PASSWORD)) ||
        (typeof process !== 'undefined' &&
            (process.env?.WEB_LOGIN_PASSWORD || process.env?.LOGIN_PASSWORD || process.env?.PASSWORD)) ||
        '';
    if (!email || !password) {
        throw new Error(
            '로그인 계정 필요. .env에 WEB_LOGIN_EMAIL, LOGIN_PASSWORD 설정 또는 환경변수 지정'
        );
    }
    return { EMAIL: email, PASSWORD: password };
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 동일 로그인 UI(이메일/비밀번호/제출)를 쓰는 URL로 이동 후 로그인.
 * 어드민·웹 모두 이 흐름을 공유하고, 진입 URL만 다르게 둔다.
 */
async function loginWithPageAtUrl(page, credentials, loginUrl) {
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    await page.goto(loginUrl);
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

/**
 * 백오피스(어드민) 로그인. 기본 URL은 `URLS.LOGIN.LOGIN`.
 */
export async function loginWithPage(page, credentials, loginUrl = URLS.LOGIN.LOGIN) {
    return loginWithPageAtUrl(page, credentials, loginUrl);
}

/**
 * 서비스(웹) 로그인. 기본 URL은 `URLS.WEB_LOGIN.LOGIN` (`/id-login`).
 * 루트(`WEB_LOGIN.HOME`)만 열면 로그인 폼이 없을 수 있으므로 기본값을 여기로 둔다.
 */
export async function loginWebWithPage(page, credentials, loginUrl = URLS.WEB_LOGIN.LOGIN) {
    return loginWithPageAtUrl(page, credentials, loginUrl);
}
