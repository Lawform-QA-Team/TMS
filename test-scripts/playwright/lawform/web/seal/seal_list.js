/**
 * 인감 목록 조회 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 인감 목록(검토 중) 진입
 * 2. 인감 원장 페이지 확인
 * 3. 인감 등록 초안 목록 확인
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { SEAL } from '../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // ── 1. 인감 검토 목록 ──────────────────────────────────────────
    await page.goto(URLS.SEAL.REVIEW);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_seal_review_list.png` });

    // ── 2. 인감 원장 ───────────────────────────────────────────────
    await page.goto(URLS.SEAL.LEDGER);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_seal_ledger.png` });

    // ── 3. 인감 초안 목록 ──────────────────────────────────────────
    await page.goto(URLS.SEAL.DRAFT);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_seal_draft_list.png` });
}
