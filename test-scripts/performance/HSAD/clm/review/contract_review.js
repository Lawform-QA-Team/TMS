import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { hsadBrowserOptions, loginToDashboard, measure } from '../../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const contractReviewPageLoad = new Trend('hsad_contract_review_page_load');

export default async function () {
    const page = await browser.newPage();
    try {
        // 1. 로그인
        await loginToDashboard(page, URLS, SELECTORS);

        // 2. 계약 검토 요청 페이지 이동 - LC_001
        await measure(contractReviewPageLoad, () => page.goto(URLS.CLM.REVIEW));

        const isReviewPage = page.url().includes('/clm/review');
        const hasTitle = await page.locator('text="계약 검토 요청 임시저장 리스트"').isVisible();

        check(page, {
            'LC_001: 계약 검토 요청 리스트 이동 확인': () => isReviewPage,
            'LC_002: 페이지 타이틀 확인': () => hasTitle,
        });

        // LC_004: 버튼 노출 확인 (삭제, 신규 검토 요청)
        const hasNewReviewButton = await page.locator('button:has-text("신규 검토 요청")').isVisible();
        const hasDeleteButton = await page.locator('button:has-text("삭제")').isVisible();

        check(page, {
            'LC_004: 신규 검토 요청 버튼 확인': () => hasNewReviewButton,
            'LC_004: 삭제 버튼 확인': () => hasDeleteButton,
        });

    } finally {
        await page.close();
    }
}