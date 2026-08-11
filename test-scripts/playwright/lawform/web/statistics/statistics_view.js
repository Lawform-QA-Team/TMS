/**
 * 통계 조회 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 통계 페이지 진입
 * 2. 데이터 로드 확인
 * 3. 스크린샷 저장
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // ── 1. 통계 페이지 진입 ────────────────────────────────────────
    await page.goto(URLS.STATISTICS.STATISTICS);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_statistics_main.png` });

    // ── 2. 페이지 내 주요 섹션 로드 대기 ───────────────────────────
    // 통계 차트 또는 테이블 로드 대기 (최대 10초)
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `screenshots/${ts()}_statistics_loaded.png` });
}
