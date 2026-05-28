/**
 * CLM Auto Doc (자동작성) 시나리오 - Playwright용
 * 플로우: 자동작성 화면 진입 → 검색 → 카테고리 탭 전환
 */
import { URLS } from '../../util/url_base_hsad.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // 자동작성 화면 진입
    await page.goto(URLS.DRIVE.AUTO);
    await page.waitForSelector('text=어떤 법률문서를 작성할까요?');
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_autodoc_home.png` });

    // 카테고리 탭 전환
    await page.getByText('카테고리', { exact: true }).click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_autodoc_category.png` });

    // 전체 탭으로 복귀
    await page.getByText('전체', { exact: true }).click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_autodoc_all.png` });

    // 검색어 입력
    const searchInput = page.getByPlaceholder('찾으시는 문서명을 입력해주세요');
    await searchInput.click();
    await searchInput.fill('비밀유지계약서');
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_autodoc_search.png` });
}
