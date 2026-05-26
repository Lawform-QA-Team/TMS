import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { hsadBrowserOptions, loginToDashboard } from '../../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const reviewListPageLoad = new Trend('hsad_clm_review_list_page_load');
const myReviewListPageLoad = new Trend('hsad_clm_my_review_list_page_load');

export default async function () {
    let page;
    try {
        const context = await browser.newContext();
        page = await context.newPage();
        await loginToDashboard(page, URLS, SELECTORS);

        // LC_358: 검토요청 조회 페이지 이동
        const startReview = Date.now();
        await page.goto(URLS.CLM.REVIEW);
        reviewListPageLoad.add(Date.now() - startReview);

        check(page, {
            'LC_358: 검토요청 조회 페이지 이동': () => page.url().includes('/clm/review'),
        });

        // LC_359: 나의 검토 요청 조회
        const startMy = Date.now();
        await page.goto(URLS.CLM.REVIEW);
        myReviewListPageLoad.add(Date.now() - startMy);

        check(page, {
            'LC_359: 나의 검토 요청 조회 페이지 로드': () => page.url().includes('/clm/review'),
        });

        // LC_360: 소속팀 검토 요청 조회
        check(page, {
            'LC_360: 소속팀 검토 요청 조회 페이지 로드': () => page.url().includes('/clm/review'),
        });

        // LC_361: 전체 검토 요청 조회
        check(page, {
            'LC_361: 전체 검토 요청 조회 페이지 로드': () => page.url().includes('/clm/review'),
        });

    } finally {
        if (page) await page.close();
    }
}
