/**
 * CLM 재무 검토 - Playwright용
 * 플로우: 재무 검토 여부 → 재무 검토 중 → 재무 검토 완료
 *
 * 환경변수:
 *   FINANCE_REVIEW: 재무 검토 여부 ('use' = 재무 검토 있음)
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
    await page.waitForSelector(CLM.FIRST_ROW);
    await page.locator(CLM.FIRST_ROW).click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_finance_review_detail.png` });

    // 재무 검토 완료 처리
    await page.waitForSelector(CLM.COMPLETE_REVIEW_BUTTON);
    await page.locator(CLM.COMPLETE_REVIEW_BUTTON).click();
    await clickFooterConfirm(page);
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_finance_review_done.png` });
}
