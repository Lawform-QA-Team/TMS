/**
 * CLM 전자서명/직접서명 - Playwright용
 * 플로우: 전자서명 or 직접서명 → 인감 사용 여부 → 서본 등록 중 → 계약 이행 중 → 계약 종료
 *
 * 환경변수:
 *   SIGN_TYPE: 서명 방식 ('esign' = 전자서명, 'direct' = 직접서명)
 *   SEAL_USE:  인감 사용 여부 ('use' = 인감 사용 신청)
 */
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../login/login_helper.js';
import { run as runSeal } from './clm_seal.js';

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

    // 서명 대상 계약 진입
    await page.goto(URLS.CLM.REVIEW);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_sign_list.png` });

    await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
    await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_sign_detail.png` });

    if (process.env.SIGN_TYPE === 'esign') {
        // 전자서명 선택 - 서명 진행 중
        await page.waitForSelector(SELECTORS.BUSINESS.CLM.SELECT_ERP_ESIGN_LABEL);
        await page.locator(SELECTORS.BUSINESS.CLM.SELECT_ERP_ESIGN_LABEL).click();
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_esign_selected.png` });

        await page.waitForSelector(SELECTORS.BUSINESS.CLM.START_BUTTON);
        await page.locator(SELECTORS.BUSINESS.CLM.START_BUTTON).click();
        await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
        await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
        await wait(3000);
        timestamp = getNewTimestamp();
        await page.screenshot({ path: `screenshots/${timestamp}_esign_started.png` });

        // 전자서명 시 인감 사용 신청 여부
        if (process.env.SEAL_USE === 'use') {
            await runSeal(page);
        }
    } else {
        // 직접서명 - 직접서명 시 인감 사용 여부
        if (process.env.SEAL_USE === 'use') {
            await runSeal(page);
        }
    }

    // 서본 등록 중
    await page.goto(URLS.CLM.REVIEW);
    await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
    await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_original_register.png` });

    await page.waitForSelector(SELECTORS.BUSINESS.CLM.SAVE_BUTTON);
    await page.locator(SELECTORS.BUSINESS.CLM.SAVE_BUTTON).click();
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_original_registered.png` });

    // 계약 이행 중
    await page.goto(URLS.CLM.COMPLETE);
    await page.waitForSelector('(//tr[contains(@class,"cursor-pointer")])[1]');
    await page.locator('(//tr[contains(@class,"cursor-pointer")])[1]').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_contract_in_progress.png` });

    // 계약 종료
    await page.waitForSelector(SELECTORS.BUSINESS.CLM.DONE_DISUSE);
    await page.locator(SELECTORS.BUSINESS.CLM.DONE_DISUSE).click();
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await wait(3000);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_contract_done.png` });
}
