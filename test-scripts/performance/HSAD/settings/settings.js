import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard, measure } from '../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const settingsPageLoad = new Trend('hsad_settings_page_load');

export default async function () {
    const page = await browser.newPage();
    try {
        await loginToDashboard(page, URLS, SELECTORS);

        // LC_006: 시스템 설정 안내 문구 확인
        await measure(settingsPageLoad, () => page.goto(URLS.SETTING.SETUP));
        const hasSettingsGuide = await page.locator(SELECTORS.SETTINGS.ADVICE_GUIDE).isVisible();

        check(page, {
            'LC_006: 설정 안내 문구 확인': () => hasSettingsGuide,
        });
    } finally {
        await page.close();
    }
}