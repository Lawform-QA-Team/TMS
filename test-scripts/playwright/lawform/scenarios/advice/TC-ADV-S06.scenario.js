/**
 * TC-ADV-S06: 자문 법무 완료 승인
 *
 * 전제 조건: 법무 처리 대기 중인 자문 건 존재
 */
import { test } from '@playwright/test';
import { login }             from '../../actions/common/common.login.js';
import { gotoDetailOrFirst } from '../../actions/advice/advice.navigate.js';
import { approveAdvice }     from '../../actions/advice/advice.review.js';

test('[TC-ADV-S06] 자문 법무 완료 승인', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await approveAdvice(page);
});
