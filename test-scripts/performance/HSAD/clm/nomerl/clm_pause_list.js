import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { hsadBrowserOptions, loginToDashboard } from '../../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const pauseListPageLoad = new Trend('hsad_clm_pause_list_page_load');

export default async function () {
    let page;
    try {
        const context = await browser.newContext();
        page = await context.newPage();
        await loginToDashboard(page, URLS, SELECTORS);

        // LC_368: 일시중단 중 요청 조회 페이지 이동
        const start = Date.now();
        await page.goto(URLS.CLM.PAUSE);
        pauseListPageLoad.add(Date.now() - start);

        check(page, {
            'LC_368: 일시중단 중 요청 조회 페이지 이동': () => page.url().includes('is_paused'),
        });

        // TODO: LC_369~LC_541 기대결과 미작성 - 추후 TC 보완 후 구현 예정

    } finally {
        if (page) await page.close();
    }
}
