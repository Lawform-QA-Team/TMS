/**
 * TC-ADV-S10: 자문 전체 프로세스 — 완료 처리 (법무 승인)
 */
import { test } from '@playwright/test';
import { login }             from '../../actions/common/common.login.js';
import { gotoDetailOrFirst } from '../../actions/advice/advice.navigate.js';
import { approveAdvice }     from '../../actions/advice/advice.review.js';

test('[TC-ADV-S10] 자문 프로세스 — 완료 처리 (승인)', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await approveAdvice(page);
});
