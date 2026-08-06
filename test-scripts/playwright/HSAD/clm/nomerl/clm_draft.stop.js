/**
 * CLM 해지 계약 검토 요청 - Playwright용
 */
import { URLS } from '../../util/url_base_hsad.js';
import { SELECTORS } from '../../util/selector_hsad.js';
import { getFormattedTimestamp } from '../../util/utils.js';
import { getCredentials, loginWithPage } from '../../login/login_helper.js';
import { clickFooterConfirm, uploadContractFromLibrary } from '../../util/helpers.js';

const CLM = SELECTORS.BUSINESS.CLM;

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // 임시 저장 리스트 호출
    await page.goto(URLS.CLM.DRAFT);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_clm.png` });

    // 신규 검토 요청 btn 클릭
    await page.waitForSelector(CLM.NEW_REVIEW_REQUEST_BUTTON);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_before_request.png` });
    await page.locator(CLM.NEW_REVIEW_REQUEST_BUTTON).click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_after_request.png` });

    // 계약 검토 요청 모달 확인 btn 클릭
    await clickFooterConfirm(page);
    await page.waitForTimeout(10000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_after_confirm.png` });

    if (process.env.CONTRACT_UPLOAD === 'use') {
        // 계약 구분 : 해지
        await page.locator(CLM.DRAFT_TYPE_STOP_LABEL).click();
        await page.waitForSelector(CLM.RELATED_CONTRACT_SEARCH_BTN);
        await page.locator(CLM.RELATED_CONTRACT_SEARCH_BTN).click();
        await page.locator(CLM.FIRST_SELECT_BUTTON).click();
        await page.screenshot({ path: `screenshots/${timestamp}_stop.png` });

        // 편집기 사용 여부
        if (process.env.EDITOR_USE === 'use') {
            await page.locator(CLM.EDITOR_USE_LABEL).click();
            await page.screenshot({ path: `screenshots/${timestamp}_editor_use.png` });
        } else {
            await page.locator(CLM.EDITOR_NOT_USE_LABEL).click();
            await page.screenshot({ path: `screenshots/${timestamp}_editor_none.png` });
        }

        // 계약서 첨부 방식
        if (process.env.CONTRACT_TYPE === 'file') {
            await page.locator(CLM.ATTACH_BY_FILE_LABEL).click();
            await page.screenshot({ path: `screenshots/${timestamp}_contract.png` });
        } else {
            await page.waitForSelector(CLM.ATTACH_FROM_MY_LABEL);
            await page.locator(CLM.ATTACH_FROM_MY_LABEL).click();
            await page.screenshot({ path: `screenshots/${timestamp}_my.png` });
        }

        // 계약서 선택
        if (process.env.CONTRACT_SELECT === 'file') {
            await page.locator(CLM.FILE_UPLOAD_ICON).click();
            await page.screenshot({ path: `screenshots/${timestamp}_file.png` });
        } else {
            await uploadContractFromLibrary(page, timestamp);
        }
    }

    // 계약명 입력, 보안 여부, 검토 진행 여부 공통
    await page.locator(CLM.CONTRACT_NAME_INPUT).fill(`신규 계약서_${timestamp}`);
    await page.screenshot({ path: `screenshots/${timestamp}_name.png` });

    if (process.env.SECURITY_TYPE === 'all') {
        await page.waitForSelector(CLM.SECURITY_ALL_LABEL, { state: 'visible', timeout: 5000 });
        await page.locator(CLM.SECURITY_ALL_LABEL).click();
        await page.screenshot({ path: `screenshots/${timestamp}_all.png` });
    } else if (process.env.SECURITY_TYPE === 'refer') {
        await page.locator(CLM.SECURITY_REFER_LABEL).click();
        await page.screenshot({ path: `screenshots/${timestamp}_refer.png` });
    } else {
        await page.locator(CLM.SECURITY_PRIVATE_LABEL).click();
        await page.screenshot({ path: `screenshots/${timestamp}_hidden.png` });
    }

    if (process.env.REVIEW_TYPE === 'use') {
        await page.locator(CLM.REVIEW_NEEDED_LABEL).click();
        await page.screenshot({ path: `screenshots/${timestamp}_review.png` });
    } else {
        await page.locator(CLM.REVIEW_NOT_NEEDED_LABEL).click();
        await page.screenshot({ path: `screenshots/${timestamp}_noreview.png` });
    }

    if (process.env.APPROVAL_SET === 'use') {
        await page.locator(CLM.ADD_APPROVER_ICON).click();
    } else {
        await page.locator(CLM.CONTRACT_REVIEW_REQUEST_BTN).click();
        await page.screenshot({ path: `screenshots/${timestamp}_creat.png` });
        await clickFooterConfirm(page);
        await page.screenshot({ path: `screenshots/${timestamp}_assignees.png` });
        await page.waitForTimeout(10000);
        await page.screenshot({ path: `screenshots/${timestamp}_new_contract.png` });
    }
}
