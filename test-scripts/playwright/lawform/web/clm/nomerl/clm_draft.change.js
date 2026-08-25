/**
 * CLM 변경 계약 검토 요청 - Playwright용
 */
import { URLS } from '../../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
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

    await page.goto(URLS.CLM.DRAFT);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_clm.png` });

    await page.waitForSelector('//button[text()="신규 검토 요청" and not(@disabled)]');
    await page.locator('//button[text()="신규 검토 요청"]').click();
    await page.screenshot({ path: `screenshots/${timestamp}_after_request.png` });

    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인" and not(@disabled)]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await wait(10000);
    await page.screenshot({ path: `screenshots/${timestamp}_after_confirm.png` });

    await page.locator('//label[.//div[text()="변경"]]').click();
    await page.waitForSelector('//div[text()="관련 계약 찾아보기"]');
    await page.locator('//div[text()="관련 계약 찾아보기"]').click();
    await page.locator('(//button[text()="선택"])[1]').click();
    await page.screenshot({ path: `screenshots/${timestamp}_related.png` });

    if (process.env.EDITOR_USE === 'use') {
        await page.locator('//label[.//div[text()="사용"]]').click();
    } else {
        await page.locator('//label[.//div[text()="사용 안 함"]]').click();
    }
    await page.screenshot({ path: `screenshots/${timestamp}_editor.png` });

    if (process.env.CONTRACT_TYPE === 'file') {
        await page.locator('//label[.//div[text()="파일로 첨부하기"]]').click();
    } else {
        await page.waitForSelector('//label[.//div[text()="My계약서에서 불러오기"]]');
        await page.locator('//label[.//div[text()="My계약서에서 불러오기"]]').click();
    }

    if (process.env.CONTRACT_SELECT === 'file') {
        await page.locator('img[alt="파일 업로드"]').click();
        await page.screenshot({ path: `screenshots/${timestamp}_file.png` });
    } else {
        await page.waitForSelector('img[alt="불러오기 아이콘"]');
        await page.locator('img[alt="불러오기 아이콘"]').click();

        try {
            await page.waitForSelector('img[src*="loading.gif"]', { state: 'hidden', timeout: 20000 });
        } catch (_) {}

        await page.waitForSelector('//div[text()="문서 불러오기"]');
        await page.locator('(//img[@alt="파일"]/ancestor::div[contains(@class, "cursor-pointer")])[1]').click();
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

        await page.locator('input[placeholder="계약명을 입력해 주세요"]').fill(`신규 계약서_${timestamp}`);
        await page.screenshot({ path: `screenshots/${timestamp}_name.png` });

        if (process.env.SECURITY_TYPE === 'all') {
            await page.waitForSelector('//label[.//div[text()="전체 공개"]]', { state: 'visible', timeout: 5000 });
            await page.locator('//label[.//div[text()="전체 공개"]]').click();
        } else if (process.env.SECURITY_TYPE === 'refer') {
            await page.locator('//label[.//div[text()="참조인"]]').click();
        } else {
            await page.locator('//label[.//div[text()="비공개"]]').click();
        }

        if (process.env.REVIEW_TYPE === 'use') {
            await page.locator('//label[.//div[text()="검토 필요"]]').click();
        } else {
            await page.locator('//label[.//div[text()="검토 불필요"]]').click();
        }

        if (process.env.APPROVAL_SET === 'use') {
            await page.locator('img[alt="결재자 추가하기"]').click();
        } else {
            await page.locator('//div[text()="계약서 검토 요청"]').click();
            await page.screenshot({ path: `screenshots/${timestamp}_creat.png` });
            await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인" and not(@disabled)]');
            await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
            await page.waitForTimeout(10000);
            await page.screenshot({ path: `screenshots/${timestamp}_new_contract.png` });
        }
    }
}
