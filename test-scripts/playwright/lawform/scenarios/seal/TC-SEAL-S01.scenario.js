/**
 * TC-SEAL-S01: 인감 목록 조회 — 검토/원장/초안 탭 전환
 */
import { test, expect } from '@playwright/test';
import { login }          from '../../actions/common/common.login.js';
import { gotoReviewList,
         gotoLedger,
         gotoDraftList }  from '../../actions/seal/seal.navigate.js';

test('[TC-SEAL-S01] 인감 목록 조회 — 검토 / 원장 / 초안', async ({ page }) => {
    await login(page);

    // 검토 목록
    await gotoReviewList(page);
    await expect(page).toHaveURL(/\/seal/);

    // 원장
    await gotoLedger(page);
    await expect(page).toHaveURL(/\/seal\/ledger/);

    // 초안
    await gotoDraftList(page);
    await expect(page).toHaveURL(/\/seal\/draft/);
});
