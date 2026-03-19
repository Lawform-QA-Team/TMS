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
 * 주어진 page에 로그인 수행 (스크린샷 포함).
 * 각 스크립트에서 page = await browser.newPage() 후 호출.
 */
export async function loginWithPage(page, credentials, metrics = null) {
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');
    const totalStartTime = Date.now();

    // 1. Page load measurement
    const pageLoadStart = Date.now();
    await page.goto(URLS.LOGIN.HOME);
    if (metrics?.pageLoadDuration) {
        const pageLoadDuration = Date.now() - pageLoadStart;
        metrics.pageLoadDuration.add(pageLoadDuration);
        console.log(`Page load duration: ${pageLoadDuration}ms`);
    }
    let timestamp = getNewTimeStamp();
    await page.screenshot({ path: `screenshots/${timestamp}_login_home.png` });

    // 2. Input credentials measurement
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

    // 3. Submit login measurement
    const submitStart = Date.now();
    await page.waitForSelector(SELECTORS.FEATURES.LOGIN.BUTTON_SUBMIT);
    await page.click(SELECTORS.FEATURES.LOGIN.BUTTON_SUBMIT);
    await page.waitForURL(URLS.LOGIN.DASHBOARD);
    if (metrics?.submitLoginDuration) {
        const submitDuration = Date.now() - submitStart;
        metrics.submitLoginDuration.add(submitDuration);
        console.log(`Submit login duration: ${submitDuration}ms`);
    }

    // 4. Total login duration
    if (metrics?.totalLoginDuration) {
        const totalDuration = Date.now() - totalStartTime;
        metrics.totalLoginDuration.add(totalDuration);
        console.log(`Total login duration: ${totalDuration}ms`);
    }
}
