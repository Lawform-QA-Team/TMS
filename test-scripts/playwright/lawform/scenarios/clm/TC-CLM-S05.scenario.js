/**
 * TC-CLM-S05: 법무 검토 반려
 *
 * 전제 조건: CLM 검토 목록에 REVIEW_REQUEST(2) 상태의 계약 존재
 */
import { test } from '@playwright/test';
import { login }              from '../../actions/common/common.login.js';
import { gotoDetailOrFirst }  from '../../actions/clm/clm.navigate.js';
import { denyLegalReview }    from '../../actions/clm/clm.legal.js';

test('[TC-CLM-S05] 법무 검토 반려', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await denyLegalReview(page, '자동화 테스트 법무 반려 사유');
});
