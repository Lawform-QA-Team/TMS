import { browser } from 'k6/browser';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { hsadBrowserOptions, loginToDashboard, measure } from '../../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const autoDocPageLoad = new Trend('hsad_auto_doc_page_load');

export default async function () {
    const page = await browser.newPage();
    try {
        // 1. 로그인
        await loginToDashboard(page, URLS, SELECTORS);

        // 2. 자동작성(Auto Doc) 화면 진입 - LC_001
        await measure(autoDocPageLoad, () => page.goto(URLS.DRIVE.AUTO));

        const hasTitle = await page.locator('text="어떤 법률문서를 작성할까요?"').isVisible();
        const hasSearchInput = await page.locator('input[placeholder="찾으시는 문서명을 입력해주세요"]').isVisible();

        check(page, {
            'LC_001: 자동작성 타이틀 확인': () => hasTitle,
            'LC_003: 검색창 placeholder 확인': () => hasSearchInput,
        });

        // LC_004: 메뉴 노출 확인 (내용증명 / 지급명령 / 계약서 등)
        const hasMenuItems = await page.locator('text="내용증명"').isVisible()
            && await page.locator('text="지급명령"').isVisible()
            && await page.locator('text="계약서"').isVisible();

        check(page, {
            'LC_004: 전체 메뉴 구성 확인': () => hasMenuItems,
        });

        // LC_008: 텍스트 입력 테스트
        const searchInput = page.locator('input[placeholder="찾으시는 문서명을 입력해주세요"]');
        await searchInput.type('비밀유지계약서');
        sleep(1);

    } finally {
        await page.close();
    }
}