/**
 * TC-CLM-S11: 인감사용 신청
 *
 * 전제 조건: FINAL_APPROVAL(6) 상태 계약에서 요청자가 실행
 */
import { test } from '@playwright/test';
import { login }             from '../../actions/common/common.login.js';
import { gotoDetailOrFirst } from '../../actions/clm/clm.navigate.js';
import { requestSeal }       from '../../actions/clm/clm.seal.js';

test('[TC-CLM-S11] 인감사용 신청', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await requestSeal(page);
});
