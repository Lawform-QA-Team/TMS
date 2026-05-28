/**
 * 블랙리스트 업체 계약 특별 승인 요청 시나리오 - Playwright용
 * 플로우: 임시저장 리스트 진입 → 블랙리스트 차단 팝업 확인
 *
 * 참고: 블랙리스트 업체 선택 시 차단 팝업이 표시되어 정상 진행 불가
 *       환경변수 BLACKLIST_TEST=true 설정 시 차단 팝업 동의 후 특별 승인 요청 처리
 */
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../util/selector_hsad.js';
import { getFormattedTimestamp } from '../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { clickFooterConfirm } from '../util/helpers.js';

const CLM = SELECTORS.BUSINESS.CLM;

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // 임시저장 리스트 진입
    await page.goto(URLS.CLM.DRAFT);
    await page.waitForSelector(CLM.NEW_REVIEW_REQUEST_BUTTON);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_blacklist_draft_list.png` });

    // 신규 검토 요청 클릭
    await page.locator(CLM.NEW_REVIEW_REQUEST_BUTTON).click();
    await clickFooterConfirm(page);
    await page.waitForTimeout(5000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_blacklist_draft_form.png` });

    if (process.env.BLACKLIST_TEST !== 'true') {
        // 블랙리스트 차단 팝업 노출 확인만 수행
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_blacklist_check_done.png` });
        return;
    }

    // 블랙리스트 차단 팝업: 동의 체크 후 특별 승인 요청
    const agreeCheckbox = page.locator('input[type="checkbox"]').last();
    if (await agreeCheckbox.isVisible()) {
        await agreeCheckbox.check();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_blacklist_agreed.png` });

        // 특별 승인 요청 버튼 클릭
        const approvalBtn = page.getByRole('button', { name: '특별 승인 요청' });
        if (await approvalBtn.isEnabled()) {
            await approvalBtn.click();
            await page.waitForTimeout(5000);
            timestamp = getNewTimestamp();
            await page.screenshot({ path: `screenshots/${timestamp}_blacklist_approval_requested.png` });
        }
    }
}
