/**
 * TC-CLM-S07: 재무 검토 승인
 *
 * 전제 조건: FINANCIAL_REVIEW(4) 상태의 계약 존재
 */
import { test } from '@playwright/test';
import { login }                   from '../../actions/common/common.login.js';
import { gotoDetailOrFirst }       from '../../actions/clm/clm.navigate.js';
import { approveFinancialReview }  from '../../actions/clm/clm.financial.js';

test('[TC-CLM-S07] 재무 검토 승인', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await approveFinancialReview(page);
});
