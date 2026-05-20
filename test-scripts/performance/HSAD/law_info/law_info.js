import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS, SELECTORS } from '../util/url_base_hsad.js';
import { hsadBrowserOptions, loginToDashboard, measure } from '../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const lawPageLoad = new Trend('hsad_law_page_load');

export default async function () {
    const page = await browser.newPage();
    try {
        await loginToDashboard(page, URLS, SELECTORS);

        // LC_001: 법령 캘린더 진입
        await measure(lawPageLoad, () => page.goto(URLS.LAW.SCHEDULE));
        const isLawPage = page.url().includes('/law');
        const hasCalendar = await page.locator('.calendar-view').isVisible()
            || await page.locator('text="법령 캘린더"').isVisible();

        check(page, {
            'LC_001: 법령 정보 페이지 진입 확인': () => isLawPage,
            'LC_008: 법령 캘린더 노출 확인': () => hasCalendar,
        });
    } finally {
        await page.close();
    }
}