/**
 * CLM 계약 진행 처리 - Playwright용
 * 플로우: (검토 진행 여부) → 내부 결재선 → 내부 결재 중 → 담당자 배정 중 → 법무 검토 중
 *
 * 환경변수:
 *   INTERNAL_APPROVAL: 내부 결재선 여부 ('use' = 내부 결재선 있음)
 */
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { run as runDraft } from './clm_draft.js';

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    await runDraft(page);

    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');
    let timestamp = getNewTimestamp();

    // 내부 결재선 여부에 따른 분기
    if (process.env.INTERNAL_APPROVAL === 'use') {
        // 내부 결재 중 - 내부 결재자가 결재 처리
        await page.goto(URLS.CLM.REVIEW);
        await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
        await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_internal_approval.png` });

        // 결재 버튼 클릭
        await page.waitForSelector(SELECTORS.BUSINESS.CLM.BUTTON_APPROVAL);
        await page.locator(SELECTORS.BUSINESS.CLM.BUTTON_APPROVAL).click();
        await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
        await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_internal_approval_done.png` });
    }

    // 담당자 배정 중
    await page.goto(URLS.CLM.REVIEW);
    await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
    await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_before_assign.png` });

    await page.waitForSelector(SELECTORS.BUSINESS.CLM.ASSIGN_BUTTON);
    await page.locator(SELECTORS.BUSINESS.CLM.ASSIGN_BUTTON).click();
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_assigned.png` });

    // 법무 검토 중 진입 확인
    await page.goto(URLS.CLM.REVIEW);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_legal_review_list.png` });
}
