/**
 * CLM 법무 검토 - Playwright용
 * 플로우: 법무 검토 중 → (요청자 검토 중) → 법무 검토 완료
 *
 * 환경변수:
 *   REQUESTER_REVIEW: 요청자 재검토 여부 ('use' = 요청자 검토 있음)
 */
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../login/login_helper.js';

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

    // 법무 검토 목록 진입
    await page.goto(URLS.CLM.REVIEW);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_legal_review_list.png` });

    // 법무 검토 중인 계약 항목 클릭
    await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
    await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_legal_review_detail.png` });

    if (process.env.REQUESTER_REVIEW === 'use') {
        // 요청자 검토 중 - 요청자에게 재검토 요청
        await page.waitForSelector(SELECTORS.BUSINESS.CLM.RESEND_TO_DEPARTMENT_BUTTON);
        await page.locator(SELECTORS.BUSINESS.CLM.RESEND_TO_DEPARTMENT_BUTTON).click();
        await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
        await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_requester_reviewing.png` });

        // 요청자 검토 완료 후 법무 검토 재진입
        await page.goto(URLS.CLM.REVIEW);
        await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
        await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_legal_review_again.png` });
    }

    // 법무 검토 완료
    await page.waitForSelector(SELECTORS.BUSINESS.CLM.LEGAL_APPROVAL_BUTTON);
    await page.locator(SELECTORS.BUSINESS.CLM.LEGAL_APPROVAL_BUTTON).click();
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_legal_review_done.png` });
}
