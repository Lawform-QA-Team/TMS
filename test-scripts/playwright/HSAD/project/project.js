/**
 * 프로젝트 조회 시나리오 - Playwright용
 * 플로우: 프로젝트 조회 진입 → 검색 → 신규 프로젝트 등록 진입
 */
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../util/selector_hsad.js';
import { getFormattedTimestamp } from '../util/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // 프로젝트 조회 페이지 진입
    await page.goto(URLS.PROJECT.PROJECT);
    await page.waitForSelector('text=프로젝트 조회');
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_project_list.png` });

    // 검색어 입력 후 검색
    const searchInput = page.getByPlaceholder('프로젝트명을 입력해 주세요.');
    await searchInput.fill('테스트');
    await page.keyboard.press('Enter');
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_project_search.png` });

    // 검색 초기화 후 전체 목록 확인
    await searchInput.fill('');
    await page.keyboard.press('Enter');
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_project_all.png` });

    // 신규 프로젝트 등록 버튼 클릭
    const registerBtn = page.locator(SELECTORS.BUSINESS.PROJECT?.REGISTER_BUTTON ?? '[data-tid="9d2da031"]');
    await registerBtn.click();
    await page.waitForURL(/\/project/);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_project_register.png` });
}
