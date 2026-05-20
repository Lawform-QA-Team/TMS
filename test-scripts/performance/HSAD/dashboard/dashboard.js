import { browser } from 'k6/browser';
import { check } from 'k6';
import { URLS, SELECTORS } from '../util/url_base_hsad.js';
import { Trend } from 'k6/metrics';
import { hsadBrowserOptions, loginToDashboard, measure } from '../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const dashboardPageLoad = new Trend('hsad_dashboard_page_load');

export default async function () {
    const page = await browser.newPage();
    try {
        // 1. 로그인
        await loginToDashboard(page, URLS, SELECTORS);

        // 2. 대시보드 진입 및 설정 확인
        await measure(dashboardPageLoad, () => page.goto(URLS.LOGIN.DASHBOARD));
        const settingBtn = page.locator(SELECTORS.DASHBOARD.SETTING);
        await settingBtn.click();

        const hasSettingsClose = await page.locator(SELECTORS.DASHBOARD.CLOSE).isVisible();

        check(page, {
            'LC_002: 대시보드 설정 노출 확인': () => hasSettingsClose,
        });
    } finally {
        await page.close();
    }
}