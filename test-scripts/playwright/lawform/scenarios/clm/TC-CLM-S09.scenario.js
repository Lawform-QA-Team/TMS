/**
 * TC-CLM-S09: 최종 승인
 *
 * 전제 조건: FINANCIAL_REVIEW_COMPLETE(5) 상태의 계약 존재
 */
import { test } from '@playwright/test';
import { login }               from '../../actions/common/common.login.js';
import { gotoDetailOrFirst }   from '../../actions/clm/clm.navigate.js';
import { approveFinalReview }  from '../../actions/clm/clm.final.js';

test('[TC-CLM-S09] 최종 승인', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await approveFinalReview(page);
});
