/**
 * 대량문서 목록 조회 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 대량문서 목록 진입
 * 2. 검색 필터 동작 확인
 * 3. 목록 체크박스 선택 확인
 * 4. 항목 상세 진입
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { BULK } from '../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // ── 1. 대량문서 목록 진입 ──────────────────────────────────────
    await page.goto(URLS.BULK.BULK);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_bulk_list.png` });

    // ── 2. 목록 테이블 뷰 — 검색 필터 ─────────────────────────────
    const searchInput = page.locator(BULK.CONDITIONS_LIST_TABLE_VIEW.INPUT_TITLE_SEARCH);
    if (await searchInput.isVisible()) {
        await searchInput.fill('계약');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `screenshots/${ts()}_bulk_search.png` });
        await searchInput.clear();
        await page.waitForTimeout(500);
    }

    // ── 3. 전체 선택 체크박스 ─────────────────────────────────────
    const selectAllCheckbox = page.locator(BULK.CONDITIONS_LIST_TABLE_VIEW.CHECKBOX_TOGGLE_SELECT_ALL);
    if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.click();
        await page.screenshot({ path: `screenshots/${ts()}_bulk_select_all.png` });
        await selectAllCheckbox.click(); // 해제
    }

    // ── 4. 첫 번째 항목 상세 진입 ─────────────────────────────────
    const goToDetailBtn = page.locator(BULK.CONDITIONS_LIST_TABLE_VIEW.BUTTON_GO_TO_DETAIL).first();
    if (await goToDetailBtn.isVisible()) {
        await goToDetailBtn.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_bulk_detail.png` });

        // ── 5. 상세 내 키워드 검색 ─────────────────────────────────
        const detailKeyword = page.locator(BULK.DETAIL.INPUT_KEYWORD);
        if (await detailKeyword.isVisible()) {
            await detailKeyword.fill('테스트');
            await page.waitForTimeout(500);
            await page.screenshot({ path: `screenshots/${ts()}_bulk_detail_search.png` });
        }

        await page.goBack();
        await page.waitForLoadState('networkidle');
    } else {
        console.log('[bulk_list] 대량문서 항목 없음 — 상세 진입 스킵');
    }
}
