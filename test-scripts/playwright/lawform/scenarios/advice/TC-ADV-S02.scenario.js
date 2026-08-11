/**
 * TC-ADV-S02: 신규 자문 요청 (분류 미선택 — 흐름 확인)
 *
 * 검증: 신규 요청 버튼 클릭 → 폼 진입 확인
 */
import { test, expect } from '@playwright/test';
import { login }                  from '../../actions/common/common.login.js';
import { gotoDraftList }          from '../../actions/advice/advice.navigate.js';
import { clickNewAdviceRequest }  from '../../actions/advice/advice.draft.js';

test('[TC-ADV-S02] 신규 자문 요청 — 폼 진입 확인', async ({ page }) => {
    await login(page);
    await gotoDraftList(page);
    await clickNewAdviceRequest(page);
    await expect(page).toHaveURL(/\/advice/);
});
