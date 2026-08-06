/**
 * HSAD Playwright 공통 헬퍼 함수
 */
import { SELECTORS } from './selector_hsad.js';
import { wait } from './utils.js';

const CLM = SELECTORS.BUSINESS.CLM;

/**
 * footer-safe-area 모달의 확인 버튼 클릭
 * @param {import('@playwright/test').Page} page
 */
export async function clickFooterConfirm(page) {
    await page.waitForSelector(CLM.FOOTER_CONFIRM_BUTTON);
    await page.locator(CLM.FOOTER_CONFIRM_BUTTON).click();
}

/**
 * My계약서에서 불러오기 플로우 공통 처리
 * @param {import('@playwright/test').Page} page
 * @param {string} timestamp
 */
export async function uploadContractFromLibrary(page, timestamp) {
    await page.waitForSelector(CLM.LOAD_ICON);
    await page.locator(CLM.LOAD_ICON).click();
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
