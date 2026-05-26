/**
 * CLM 재무 검토 - Playwright용
 * 플로우: 재무 검토 여부 → 재무 검토 중 → 재무 검토 완료
 *
 * 환경변수:
 *   FINANCE_REVIEW: 재무 검토 여부 ('use' = 재무 검토 있음)
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

    // 재무 검토 여부에 따른 분기
    if (process.env.FINANCE_REVIEW !== 'use') {
        // 재무 검토 없음 - 이 단계 건너뜀
        return;
    }

    // 재무 검토 목록 진입
    await page.goto(URLS.CLM.REVIEW);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_finance_review_list.png` });

    // 재무 검토 중인 계약 항목 클릭
    await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
    await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_finance_review_detail.png` });

    // 재무 검토 완료 처리
    await page.waitForSelector(SELECTORS.BUSINESS.CLM.COMPLETE_REVIEW_BUTTON);
    await page.locator(SELECTORS.BUSINESS.CLM.COMPLETE_REVIEW_BUTTON).click();
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_finance_review_done.png` });
}
