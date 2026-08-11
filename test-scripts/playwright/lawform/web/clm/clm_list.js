/**
 * CLM 목록 조회 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. CLM 초안 목록 진입
 * 2. 상태 탭 전환 (초안 → 검토 → 완료)
 * 3. 키워드 검색
 * 4. 카테고리 필터
 * 5. 엑셀 다운로드 버튼 존재 확인
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { CLM } from '../../selectors/index.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // ── 1. CLM 초안 목록 진입 ──────────────────────────────────────
    await page.goto(URLS.CLM.DRAFT);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_clm_draft_list.png` });

    // ── 2. 상태 탭 전환 ────────────────────────────────────────────
    // 검토 탭
    await page.goto(URLS.CLM.REVIEW);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_clm_review_list.png` });

    // 완료 탭
    await page.goto(URLS.CLM.COMPLETE);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_clm_complete_list.png` });

    // ── 3. 검색 페이지 진입 및 키워드 검색 ──────────────────────────
    await page.goto(URLS.CLM.SEARCH);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator(CLM.SEARCH_INPUT.INPUT_CHANGE);
    if (await searchInput.isVisible()) {
        await searchInput.fill('계약');
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_clm_search_result.png` });

        // 검색어 초기화
        const clearBtn = page.locator(CLM.SEARCH_INPUT.BUTTON_CLEAR);
        if (await clearBtn.isVisible()) {
            await clearBtn.click();
        }
    }

    // ── 4. 검색 필터 (키워드 + 검색 버튼) ──────────────────────────
    const filterKeyword = page.locator(CLM.SEARCH_FILTER.INPUT_KEYWORD_CHANGE);
    if (await filterKeyword.isVisible()) {
        await filterKeyword.fill('테스트');
        await page.locator(CLM.SEARCH_FILTER.BUTTON_SEARCH).click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_clm_filter_search.png` });

        await page.locator(CLM.SEARCH_FILTER.BUTTON_RESET).click();
        await page.waitForLoadState('networkidle');
    }

    // ── 5. 엑셀 다운로드 버튼 노출 확인 ────────────────────────────
    const excelBtn = page.locator(CLM.EXCEL_DOWNLOAD_BUTTON.BUTTON_R_CLICK_EXCEL_DOWNLOAD);
    if (await excelBtn.isVisible()) {
        await page.screenshot({ path: `screenshots/${ts()}_clm_excel_btn.png` });
    }
}
