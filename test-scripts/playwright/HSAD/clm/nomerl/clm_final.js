/**
 * CLM 최종 결재 - Playwright용
 * 플로우: 최종 결재 여부 → 최종 결재 중 → 최종 결재 완료
 *
 * 환경변수:
 *   FINAL_APPROVAL: 최종 결재 여부 ('use' = 최종 결재 있음)
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

    // 최종 결재 여부에 따른 분기
    if (process.env.FINAL_APPROVAL !== 'use') {
        // 최종 결재 없음 - 이 단계 건너뜀
        return;
    }

    // 최종 결재 요청
    await page.goto(URLS.CLM.REVIEW);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_final_approval_list.png` });

    await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
    await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_final_approval_detail.png` });

    // 최종 결재 요청 버튼 클릭
    await page.waitForSelector(SELECTORS.BUSINESS.CLM.BUTTON_FINAL_APPROVAL_REQUEST);
    await page.locator(SELECTORS.BUSINESS.CLM.BUTTON_FINAL_APPROVAL_REQUEST).click();
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_final_approval_requested.png` });

    // 최종 결재 중 - 결재자가 결재 처리
    await page.goto(URLS.CLM.REVIEW);
    await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
    await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_final_approving.png` });

    await page.waitForSelector(SELECTORS.BUSINESS.CLM.BUTTON_APPROVAL);
    await page.locator(SELECTORS.BUSINESS.CLM.BUTTON_APPROVAL).click();
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_final_approval_done.png` });
}
