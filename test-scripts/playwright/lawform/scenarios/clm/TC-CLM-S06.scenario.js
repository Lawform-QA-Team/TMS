/**
 * TC-CLM-S06: 재무검토 요청
 *
 * 전제 조건: LEGAL_REVIEW_COMPLETE(3) 상태의 계약 존재 (법무 검토 완료 후)
 */
import { test } from '@playwright/test';
import { login }                  from '../../actions/common/common.login.js';
import { gotoDetailOrFirst }      from '../../actions/clm/clm.navigate.js';
import { requestFinancialReview } from '../../actions/clm/clm.financial.js';

test('[TC-CLM-S06] 재무검토 요청', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await requestFinancialReview(page);
});
