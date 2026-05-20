import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard, measure } from '../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const projectPageLoad = new Trend('hsad_project_page_load');

export default async function () {
    const page = await browser.newPage();
    try {
        await loginToDashboard(page, URLS, SELECTORS);

        // LC_002: 프로젝트 조회 페이지 이동
        await measure(projectPageLoad, () => page.goto(URLS.PROJECT.PROJECT));
        const isProjectPage = page.url().includes('/project');
        const hasTitle = await page.locator(SELECTORS.PROJECT.TITLE).isVisible();

        check(page, {
            'LC_002: 프로젝트 조회 페이지 이동 확인': () => isProjectPage,
            'LC_003: 페이지 타이틀 확인': () => hasTitle,
        });

        // LC_010: 드롭다운 플레이스홀더 확인
        const hasProjectCategory = await page.locator(SELECTORS.PROJECT.SELECT_MAJOR_CATEGORY_TEXT).isVisible()
            || await page.locator(SELECTORS.PROJECT.SELECT_MAJOR_CATEGORY_PLACEHOLDER).isVisible();

        check(page, {
            'LC_010: 프로젝트 대분류 드롭다운 확인': () => hasProjectCategory,
        });
    } finally {
        await page.close();
    }
}