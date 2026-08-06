/**
 * 계약 정보 관리 시나리오 - Playwright용
 * 플로우: 계약처 관리 진입 → 법인/개인사업자/개인 탭 전환 → 검색
 */
import { URLS } from '../util/url_base_hsad.js';
import { getFormattedTimestamp } from '../util/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // 계약처 관리 진입
    await page.goto(URLS.CONTRACT.CONTRACT);
    await page.waitForSelector('text=계약처 관리');
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_contract_mgmt.png` });

    // 법인 탭 선택
    await page.getByRole('tab', { name: '법인' }).click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_contract_corp.png` });

    // 법인 검색
    const corpSearch = page.getByPlaceholder('기업명을 검색해보세요');
    await corpSearch.fill('테스트');
    await corpSearch.locator('..').getByRole('button').click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_contract_corp_search.png` });

    // 개인사업자 탭 선택
    await page.getByRole('tab', { name: '개인사업자' }).click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_contract_sole.png` });

    // 개인 탭 선택
    await page.getByRole('tab', { name: '개인' }).click();
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_contract_individual.png` });

    // 기업 직인 페이지 진입
    await page.goto(URLS.CONTRACT.TEAM_STAMP);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_contract_team_stamp.png` });

    // 직인 페이지 진입
    await page.goto(URLS.CONTRACT.STAMP);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_contract_stamp.png` });

    // 로고 페이지 진입
    await page.goto(URLS.CONTRACT.LOGO);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_contract_logo.png` });
}
