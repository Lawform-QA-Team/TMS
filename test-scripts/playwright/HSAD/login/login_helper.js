import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../util/selector_hsad.js';

/**
 * 환경변수에서 로그인 계정 반환
 * LOGIN_EMAIL → EMAIL 순으로 우선 적용
 */
export function getCredentials() {
    const email = process.env.LOGIN_EMAIL || process.env.EMAIL || '';
    const password = process.env.LOGIN_PASSWORD || process.env.PASSWORD || '';
    if (!email || !password) {
        throw new Error('로그인 계정 필요. .env에 LOGIN_EMAIL, LOGIN_PASSWORD 설정');
    }
    return { EMAIL: email, PASSWORD: password };
}

/**
 * 로그인 수행. 기본 URL은 URLS.LOGIN.LOGIN.
 */
export async function loginWithPage(page, credentials, loginUrl = URLS.LOGIN.LOGIN) {
    await page.goto(loginUrl);
    await page.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT);
    await page.locator(SELECTORS.LOGIN.EMAIL_INPUT).fill(credentials.EMAIL);
    await page.waitForSelector(SELECTORS.LOGIN.PASSWORD_INPUT);
    await page.locator(SELECTORS.LOGIN.PASSWORD_INPUT).fill(credentials.PASSWORD);
    await page.waitForSelector(SELECTORS.LOGIN.SUBMIT_BUTTON);
    await page.click(SELECTORS.LOGIN.SUBMIT_BUTTON);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
}
