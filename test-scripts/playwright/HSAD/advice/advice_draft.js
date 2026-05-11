/**
 * 법률 자문 요청 - Playwright용
 */
import { URLS } from '../util/url_base_hsad.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // 법률 자문 임시 저장 리스트 호출
    await page.goto(URLS.ADVICE.DRAFT);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_advice_draft.png` });

    // 신규 자문 요청 btn 선택
    await page.waitForSelector('//button[text()="신규 자문 요청" and not(@disabled)]');
    await page.locator('//button[text()="신규 자문 요청"]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_after_request.png` });

    // 법률 자문 요청 모달 확인 btn 클릭
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인" and not(@disabled)]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    timestamp = getNewTimestamp();
    await wait(10000);
    await page.screenshot({ path: `screenshots/${timestamp}_after_confirm.png` });

    // 자문 분류 선택
    await page.waitForSelector('//img[@alt="arrow"]');
    await page.locator('//img[@alt="arrow"]').click();

    const adviceType = process.env.ADVICE_TYPE;
    if (adviceType === 'pi') {
        // TODO: 개인정보 자문 분류 선택
    } else if (adviceType === 'cn') {
        // TODO: 계약 자문 분류 선택
    } else if (adviceType === 'ft') {
        // TODO: 금융 자문 분류 선택
    } else if (adviceType === 'ma') {
        // TODO: M&A 자문 분류 선택
    } else if (adviceType === 'ci') {
        // TODO: 공정거래 자문 분류 선택
    } else if (adviceType === 'tl') {
        // TODO: 기술/라이선스 자문 분류 선택
    } else if (adviceType === 'la') {
        // TODO: 노동 자문 분류 선택
    } else if (adviceType === 'hr') {
        // TODO: HR 자문 분류 선택
    } else if (adviceType === 'cole') {
        // TODO: 공동 법적 자문 분류 선택
    } else if (adviceType === 'overle') {
        // TODO: 해외 법적 자문 분류 선택
    } else if (adviceType === 'etc') {
        // TODO: 기타 자문 분류 선택
    } else {
        console.log('ADVICE_TYPE 환경변수 필요');
    }
}
