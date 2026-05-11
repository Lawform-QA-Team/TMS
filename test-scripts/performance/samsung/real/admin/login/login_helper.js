import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';

/**
 * k6 환경변수에서 관리자 로그인 계정 반환 (ADMIN_LOGIN_EMAIL, ADMIN_LOGIN_PASSWORD)
 */
export function getCredentials() {
    const email = (typeof __ENV !== 'undefined' && (__ENV.ADMIN_LOGIN_EMAIL || __ENV.LOGIN_EMAIL || __ENV.EMAIL)) || '';
    const password = (typeof __ENV !== 'undefined' && (__ENV.ADMIN_LOGIN_PASSWORD || __ENV.LOGIN_PASSWORD || __ENV.PASSWORD)) || '';
    if (!email || !password) {
        throw new Error('로그인 계정 필요. k6 실행 시 -e ADMIN_LOGIN_EMAIL=... -e ADMIN_LOGIN_PASSWORD=... 스크립트경로');
    }
    return { EMAIL: email, PASSWORD: password };
}

/**
 * k6 환경변수에서 웹 서비스 로그인 계정 반환 (WEB_LOGIN_EMAIL, WEB_LOGIN_PASSWORD)
 */
export function getWebCredentials() {
    const email = (typeof __ENV !== 'undefined' && (__ENV.WEB_LOGIN_EMAIL || __ENV.LOGIN_EMAIL || __ENV.EMAIL)) || '';
    const password = (typeof __ENV !== 'undefined' && (__ENV.WEB_LOGIN_PASSWORD || __ENV.LOGIN_PASSWORD || __ENV.PASSWORD)) || '';
    if (!email || !password) {
        throw new Error('로그인 계정 필요. k6 실행 시 -e WEB_LOGIN_EMAIL=... -e WEB_LOGIN_PASSWORD=... 스크립트경로');
    }
    return { EMAIL: email, PASSWORD: password };
}

/**
 * @param {import('k6/browser').Page} page
 * @param {{ EMAIL: string, PASSWORD: string }} credentials
 * @param {{ loginUrl: string, postSubmitWaitUrl?: string | null, metrics?: object | null }} opts
 */
async function loginWithPageAtUrl(page, credentials, opts) {
    const { loginUrl, postSubmitWaitUrl = null, metrics = null } = opts;
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');
    const totalStartTime = Date.now();

    const pageLoadStart = Date.now();
    await page.goto(loginUrl);
    if (metrics?.pageLoadDuration) {
        const pageLoadDuration = Date.now() - pageLoadStart;
        metrics.pageLoadDuration.add(pageLoadDuration);
        console.log(`Page load duration: ${pageLoadDuration}ms`);
    }
    let timestamp = getNewTimeStamp();
    await page.screenshot({ path: `screenshots/${timestamp}_login_home.png` });

    const inputStart = Date.now();
    await page.waitForSelector(SELECTORS.FEATURES.LOGIN.INPUT_EMAIL);
    await page.type(SELECTORS.FEATURES.LOGIN.INPUT_EMAIL, credentials.EMAIL);
    await page.waitForSelector(SELECTORS.FEATURES.LOGIN.INPUT_PASSWORD);
    await page.type(SELECTORS.FEATURES.LOGIN.INPUT_PASSWORD, credentials.PASSWORD);
    if (metrics?.inputCredentialsDuration) {
        const inputDuration = Date.now() - inputStart;
        metrics.inputCredentialsDuration.add(inputDuration);
        console.log(`Input credentials duration: ${inputDuration}ms`);
    }

    timestamp = getNewTimeStamp();
    await page.screenshot({ path: `screenshots/${timestamp}_input_account.png` });

    const submitStart = Date.now();
    await page.waitForSelector(SELECTORS.FEATURES.LOGIN.BUTTON_SUBMIT);
    await page.click(SELECTORS.FEATURES.LOGIN.BUTTON_SUBMIT);
    if (postSubmitWaitUrl) {
        await page.waitForURL(postSubmitWaitUrl);
    }
    if (metrics?.submitLoginDuration) {
        const submitDuration = Date.now() - submitStart;
        metrics.submitLoginDuration.add(submitDuration);
        console.log(`Submit login duration: ${submitDuration}ms`);
    }

    if (metrics?.totalLoginDuration) {
        const totalDuration = Date.now() - totalStartTime;
        metrics.totalLoginDuration.add(totalDuration);
        console.log(`Total login duration: ${totalDuration}ms`);
    }
}

/**
 * 백오피스(어드민) 로그인. 제출 후 대시보드 URL까지 대기.
 */
export async function loginWithPage(page, credentials, metrics = null) {
    return loginWithPageAtUrl(page, credentials, {
        loginUrl: URLS.LOGIN.LOGIN,
        postSubmitWaitUrl: URLS.LOGIN.DASHBOARD,
        metrics,
    });
}

/**
 * 서비스(웹) 로그인. 기본은 `/id-login`. 제출 후 별도 URL 대기 없음(기존 k6 웹 스크립트와 동일).
 */
export async function loginWebWithPage(page, credentials, metrics = null) {
    return loginWithPageAtUrl(page, credentials, {
        loginUrl: URLS.WEB_LOGIN.LOGIN,
        postSubmitWaitUrl: URLS.DRIVE.DRIVE,
        metrics,
    });
}
