/**
 * 법령 정보 - 법령 캘린더 시나리오 - Playwright용
 * 플로우: 법령 캘린더 진입 → 화면 확인 → 스크린샷
 *
 * 참고: TC 기대결과 미작성 (LC_001~LC_083 전체), 추후 보완 예정
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

    // 법령 캘린더 진입
    await page.goto(URLS.LAW.SCHEDULE);
    await page.waitForURL(/\/law/);
    let timestamp = getNewTimestamp();
    await page.screenshot({ path: `screenshots/${timestamp}_law_calendar.png` });
}
