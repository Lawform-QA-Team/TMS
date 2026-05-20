import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard, measure } from '../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const litigationDashboardLoad = new Trend('hsad_litigation_dashboard_load');

export default async function () {
    const page = await browser.newPage();
    try {
        await loginToDashboard(page, URLS, SELECTORS);
        await measure(litigationDashboardLoad, () => page.goto(URLS.LOGIN.DASHBOARD));

        // LC_001: 송무 메뉴 노출
        const hasLitigationMenu = await page.locator(SELECTORS.LITIGATION.MENU).isVisible();
        check(page, {
            'LC_001: 송무 메뉴 노출 확인': () => hasLitigationMenu,
        });

        // LC_002: 하위 트리 노출 확인
        const litigationMenu = page.locator(SELECTORS.LITIGATION.MENU);
        await litigationMenu.click();
        const hasDraftMenu = await page.locator(SELECTORS.LITIGATION.MENU_DRAFT).isVisible();
        const hasReviewMenu = await page.locator(SELECTORS.LITIGATION.MENU_REVIEW).isVisible();
        check(page, {
            'LC_002: 송무 등록 노출': () => hasDraftMenu,
            'LC_002: 송무 조회 노출': () => hasReviewMenu,
        });
    } finally {
        await page.close();
    }
}