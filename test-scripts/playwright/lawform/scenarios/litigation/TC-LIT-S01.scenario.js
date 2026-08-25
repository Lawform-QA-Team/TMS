/**
 * TC-LIT-S01: 송무 신규 등록 — 폼 진입 확인
 */
import { test, expect } from '@playwright/test';
import { login }                      from '../../actions/common/common.login.js';
import { gotoDraftList }              from '../../actions/litigation/litigation.navigate.js';
import { clickNewLitigationButton }   from '../../actions/litigation/litigation.draft.js';

test('[TC-LIT-S01] 송무 신규 등록 — 폼 진입', async ({ page }) => {
    await login(page);
    await gotoDraftList(page);
    await expect(page).toHaveURL(/\/litigation\/draft/);
    await clickNewLitigationButton(page);
});
