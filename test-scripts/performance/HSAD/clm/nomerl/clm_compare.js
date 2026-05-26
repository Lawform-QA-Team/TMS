import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { hsadBrowserOptions, loginToDashboard } from '../../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const comparePageLoad = new Trend('hsad_clm_compare_page_load');

export default async function () {
    let page;
    try {
        const context = await browser.newContext();
        page = await context.newPage();
        await loginToDashboard(page, URLS, SELECTORS);

        // LC_367: AI 계약 내용 비교 페이지 이동
        const start = Date.now();
        await page.goto(URLS.CLM.COMPARE);
        comparePageLoad.add(Date.now() - start);

        check(page, {
            'LC_367: AI 계약 내용 비교 페이지 이동': () => page.url().includes('/document_compare'),
        });

        // 비교 버튼 노출 확인
        const hasCompareBtn = await page.locator(SELECTORS.BUSINESS.DOCUMENT_COMPARE.COMPARE_BUTTON).isVisible();
        check(page, {
            'LC_367: 비교 버튼 노출': () => hasCompareBtn,
        });

    } finally {
        if (page) await page.close();
    }
}
