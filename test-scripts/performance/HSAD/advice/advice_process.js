import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard, measure } from '../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const adviceDashboardLoad = new Trend('hsad_advice_dashboard_load');
const adviceSettingsLoad = new Trend('hsad_advice_settings_load');

export default async function () {
    const page = await browser.newPage();
    try {
        await loginToDashboard(page, URLS, SELECTORS);

        // LC_002: 법률 자문 메뉴 노출 확인 (SNB)
        await measure(adviceDashboardLoad, () => page.goto(URLS.LOGIN.DASHBOARD));
        const hasAdviceMenu = await page.locator(SELECTORS.ADVICE.MENU).isVisible();
        check(page, {
            'LC_002: 법률 자문 메뉴 노출 확인': () => hasAdviceMenu,
        });

        // LC_005: 법률 자문 관리 설정 확인
        await measure(adviceSettingsLoad, () => page.goto(URLS.SETTING.SETUP));
        const hasAdviceSettings = await page.locator(SELECTORS.ADVICE.SETTINGS_TITLE).isVisible();
        check(page, {
            'LC_005: 법률 자문 관리 메뉴 노출': () => hasAdviceSettings,
        });
    } finally {
        await page.close();
    }
}