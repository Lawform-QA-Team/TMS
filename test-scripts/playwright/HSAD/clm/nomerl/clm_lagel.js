/**
 * CLM 법무 검토 - Playwright용
 * 플로우: 법무 검토 중 → (요청자 검토 중) → 법무 검토 완료
 *
 * 환경변수:
 *   REQUESTER_REVIEW: 요청자 재검토 여부 ('use' = 요청자 검토 있음)
 */
import { URLS } from '../../util/url_base_hsad.js';
import { SELECTORS } from '../../util/selector_hsad.js';
import { getFormattedTimestamp, wait } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../login/login_helper.js';
import { clickFooterConfirm } from '../../util/helpers.js';

const CLM = SELECTORS.BUSINESS.CLM;

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
    await page.waitForSelector(CLM.FIRST_ROW);
    await page.locator(CLM.FIRST_ROW).click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_legal_review_detail.png` });

    if (process.env.REQUESTER_REVIEW === 'use') {
        // 요청자 검토 중 - 요청자에게 재검토 요청
        await page.waitForSelector(CLM.RESEND_TO_DEPARTMENT_BUTTON);
        await page.locator(CLM.RESEND_TO_DEPARTMENT_BUTTON).click();
        await clickFooterConfirm(page);
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_requester_reviewing.png` });

        // 요청자 검토 완료 후 법무 검토 재진입
        await page.goto(URLS.CLM.REVIEW);
        await page.waitForSelector(CLM.FIRST_ROW);
        await page.locator(CLM.FIRST_ROW).click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_legal_review_again.png` });
    }

    // 법무 검토 완료
    await page.waitForSelector(CLM.LEGAL_APPROVAL_BUTTON);
    await page.locator(CLM.LEGAL_APPROVAL_BUTTON).click();
    await clickFooterConfirm(page);
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_legal_review_done.png` });
}
