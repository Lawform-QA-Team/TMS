/**
 * CLM 해지 계약 검토 요청 - Playwright용
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

    // 임시 저장 리스트 호출
    await page.goto(URLS.CLM.DRAFT);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_clm.png` });

    // 신규 검토 요청 btn 클릭
    await page.waitForSelector(SELECTORS.BUSINESS.CLM.NEW_REVIEW_REQUEST_BUTTON);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_before_request.png` });
    await page.locator(SELECTORS.BUSINESS.CLM.NEW_REVIEW_REQUEST_BUTTON).click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_after_request.png` });

    // 계약 검토 요청 모달 확인 btn 클릭
    // TODO: data-tid 없음 (footer-safe-area 모달 확인 버튼)
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    timestamp = getNewTimestamp();
    await wait(10000);
    await page.screenshot({ path: `screenshots/${timestamp}_after_confirm.png` });

    if (process.env.CONTRACT_UPLOAD === 'use') {
        // 계약 구분 : 해지
        await page.locator('//label[.//div[text()="해지"]]').click();
        await page.waitForSelector('//div[text()="관련 계약 찾아보기"]');
        await page.locator('//div[text()="관련 계약 찾아보기"]').click();
        await page.locator('(//button[text()="선택"])[1]').click();
        await page.screenshot({ path: `screenshots/${timestamp}_stop.png` });

        // 편집기 사용 여부
        if (process.env.EDITOR_USE === 'use') {
            await page.locator('//label[.//div[text()="사용"]]').click();
            await page.screenshot({ path: `screenshots/${timestamp}_editor_use.png` });
        } else {
            await page.locator('//label[.//div[text()="사용 안 함"]]').click();
            await page.screenshot({ path: `screenshots/${timestamp}_editor_none.png` });
        }

        // 계약서 첨부 방식
        if (process.env.CONTRACT_TYPE === 'file') {
            await page.locator('//label[.//div[text()="파일로 첨부하기"]]').click();
            await page.screenshot({ path: `screenshots/${timestamp}_contract.png` });
        } else {
            await page.waitForSelector('//label[.//div[text()="My계약서에서 불러오기"]]');
            await page.locator('//label[.//div[text()="My계약서에서 불러오기"]]').click();
            await page.screenshot({ path: `screenshots/${timestamp}_my.png` });
        }

        // 계약서 선택
        if (process.env.CONTRACT_SELECT === 'file') {
            await page.locator('img[alt="파일 업로드"]').click();
            await page.screenshot({ path: `screenshots/${timestamp}_file.png` });
        } else {
            await page.waitForSelector('img[alt="불러오기 아이콘"]');
            await page.locator('img[alt="불러오기 아이콘"]').click();
            await page.screenshot({ path: `screenshots/${timestamp}_load.png` });

            try {
                await page.waitForSelector('img[src*="loading.gif"]', { state: 'hidden', timeout: 20000 });
            } catch (_) {
                await page.screenshot({ path: `screenshots/${timestamp}_loading_timeout.png` });
            }

            await page.waitForSelector('//div[text()="문서 불러오기"]');
            await page.locator('(//img[@alt="파일"]/ancestor::div[contains(@class, "cursor-pointer")])[1]').click();
            await page.screenshot({ path: `screenshots/${timestamp}_contract.png` });

            await page.waitForSelector('//button[text()="선택"]', { state: 'visible', timeout: 5000 });
            await page.locator('//button[text()="선택"]').click();
            await page.screenshot({ path: `screenshots/${timestamp}_select.png` });

            try {
                await page.waitForSelector('img[src*="loading.gif"]', { state: 'hidden', timeout: 20000 });
            } catch (_) {}

            try {
                await page.waitForSelector('//div[text()="문서 불러오기"]', { state: 'hidden', timeout: 10000 });
            } catch (_) {}

            await wait(500);
        }
    }

    // 계약명 입력, 보안 여부, 검토 진행 여부 공통
    await page.locator('input[placeholder="계약명을 입력해 주세요"]').fill(`신규 계약서_${timestamp}`);
    await page.screenshot({ path: `screenshots/${timestamp}_name.png` });

    if (process.env.SECURITY_TYPE === 'all') {
        await page.waitForSelector('//label[.//div[text()="전체 공개"]]', { state: 'visible', timeout: 5000 });
        await page.locator('//label[.//div[text()="전체 공개"]]').click();
        await page.screenshot({ path: `screenshots/${timestamp}_all.png` });
    } else if (process.env.SECURITY_TYPE === 'refer') {
        await page.locator('//label[.//div[text()="참조인"]]').click();
        await page.screenshot({ path: `screenshots/${timestamp}_refer.png` });
    } else {
        await page.locator('//label[.//div[text()="비공개"]]').click();
        await page.screenshot({ path: `screenshots/${timestamp}_hidden.png` });
    }

    if (process.env.REVIEW_TYPE === 'use') {
        await page.locator('//label[.//div[text()="검토 필요"]]').click();
        await page.screenshot({ path: `screenshots/${timestamp}_review.png` });
    } else {
        await page.locator('//label[.//div[text()="검토 불필요"]]').click();
        await page.screenshot({ path: `screenshots/${timestamp}_noreview.png` });
    }

    if (process.env.APPROVAL_SET === 'use') {
        await page.locator('img[alt="결재자 추가하기"]').click();
    } else {
        await page.locator('//div[text()="계약서 검토 요청"]').click();
        await page.screenshot({ path: `screenshots/${timestamp}_creat.png` });
        // TODO: data-tid 없음 (footer-safe-area 모달 확인 버튼)
        await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
        await page.screenshot({ path: `screenshots/${timestamp}_assignees.png` });
        await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
        await page.waitForTimeout(10000);
        await page.screenshot({ path: `screenshots/${timestamp}_new_contract.png` });
    }
}
