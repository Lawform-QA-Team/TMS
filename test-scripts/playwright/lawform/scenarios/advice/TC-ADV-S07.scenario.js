/**
 * TC-ADV-S07: 자문 법무 반려
 */
import { test } from '@playwright/test';
import { login }             from '../../actions/common/common.login.js';
import { gotoDetailOrFirst } from '../../actions/advice/advice.navigate.js';
import { denyAdvice }        from '../../actions/advice/advice.review.js';

test('[TC-ADV-S07] 자문 법무 반려', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await denyAdvice(page, '자동화 테스트 자문 반려 사유');
});
