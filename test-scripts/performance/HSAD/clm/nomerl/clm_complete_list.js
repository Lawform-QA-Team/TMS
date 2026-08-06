import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS } from '../../util/url_base_hsad.js';
import { SELECTORS } from '../../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard } from '../../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const completeListPageLoad = new Trend('hsad_clm_complete_list_page_load');

export default async function () {
    let page;
    try {
        const context = await browser.newContext();
        page = await context.newPage();
        await loginToDashboard(page, URLS, SELECTORS);

        // LC_362: 체결 계약서 조회 페이지 이동
        const start = Date.now();
        await page.goto(URLS.CLM.COMPLETE);
        completeListPageLoad.add(Date.now() - start);

        check(page, {
            'LC_362: 체결 계약서 조회 페이지 이동': () => page.url().includes('/clm/complete'),
        });

        // LC_363: 나의 체결 계약서 조회
        check(page, {
            'LC_363: 나의 체결 계약서 조회 페이지 로드': () => page.url().includes('/clm/complete'),
        });

        // LC_364: 소속팀 체결 계약서 조회
        check(page, {
            'LC_364: 소속팀 체결 계약서 조회 페이지 로드': () => page.url().includes('/clm/complete'),
        });

        // LC_365: 전체 체결 계약서 조회
        check(page, {
            'LC_365: 전체 체결 계약서 조회 페이지 로드': () => page.url().includes('/clm/complete'),
        });

        // LC_366: 체결 계약서 별도 등록
        check(page, {
            'LC_366: 체결 계약서 별도 등록 페이지 로드': () => page.url().includes('/clm/complete'),
        });

    } finally {
        if (page) await page.close();
    }
}
