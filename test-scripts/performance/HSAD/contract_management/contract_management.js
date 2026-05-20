import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard, measure } from '../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const contractManagementLoad = new Trend('hsad_contract_management_page_load');

export default async function () {
    const page = await browser.newPage();
    try {
        await loginToDashboard(page, URLS, SELECTORS);

        // LC_001, LC_003: 계약처 관리 타이틀 및 법인 탭 확인
        await measure(contractManagementLoad, () => page.goto(URLS.CONTRACT.CONTRACT));
        const hasCorporateTab = await page.locator(SELECTORS.CONTRACT_MANAGEMENT.TAB_CORPORATE).isVisible();
        const hasTitle = await page.locator(SELECTORS.CONTRACT_MANAGEMENT.TITLE).isVisible();
        check(page, {
            'LC_001: 법인 탭 노출 확인': () => hasCorporateTab,
            'LC_003: 계약처 관리 타이틀 확인': () => hasTitle,
        });

        // LC_009: 검색창 placeholder 확인
        const hasSearchInput = await page.locator(SELECTORS.CONTRACT_MANAGEMENT.INPUT_COMPANY_SEARCH).isVisible();
        check(page, {
            'LC_009: 검색창 placeholder 확인': () => hasSearchInput,
        });
    } finally {
        await page.close();
    }
}