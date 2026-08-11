/**
 * TC-CLM-S08: 재무 검토 반려
 */
import { test } from '@playwright/test';
import { login }                  from '../../actions/common/common.login.js';
import { gotoDetailOrFirst }      from '../../actions/clm/clm.navigate.js';
import { denyFinancialReview }    from '../../actions/clm/clm.financial.js';

test('[TC-CLM-S08] 재무 검토 반려', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await denyFinancialReview(page, '자동화 테스트 재무 반려 사유');
});
