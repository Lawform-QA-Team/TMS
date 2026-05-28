/**
 * 시스템 설정 시나리오 - Playwright용
 * 플로우: 구성원 관리 → 계정 설정 → Setup 페이지 순회
 */
import { URLS } from '../util/url_base_hsad.js';
import { getFormattedTimestamp } from '../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const getNewTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // 구성원 관리 진입
    await page.goto(URLS.SETTING.TEAM);
    await page.waitForURL(/\/teams/);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_settings_team.png` });

    // 계정 설정 진입
    await page.goto(URLS.SETTING.ACCOUNT);
    await page.waitForURL(/type=account/);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_settings_account.png` });

    // Setup 진입
    await page.goto(URLS.SETTING.SETUP);
    await page.waitForURL(/\/setup/);
    timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_settings_setup.png` });
}
