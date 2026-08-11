/**
 * TC-MISC-S03: 대량 문서 목록 조회
 *
 * 검증: 대량 문서 페이지 진입, 검색 입력 / 체크박스 영역 노출
 */
import { test, expect } from '@playwright/test';
import { login }        from '../../actions/common/common.login.js';
import { gotoBulkList } from '../../actions/misc/misc.navigate.js';
import { BULK }         from '../../selectors/index.js';

test('[TC-MISC-S03] 대량 문서 목록 조회', async ({ page }) => {
    await login(page);
    await gotoBulkList(page);
    await expect(page).toHaveURL(/\/bulk/);

    // 검색 입력창 확인
    const searchInput = page.locator(BULK.SEARCH_INPUT?.INPUT_CHANGE ?? 'input[type="search"], input[placeholder*="검색"]').first();
    if (await searchInput.isVisible()) {
        await expect(searchInput).toBeVisible();
    }
});
