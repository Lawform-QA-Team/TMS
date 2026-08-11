/**
 * TC-CLM-S14: 전자서명 요청
 *
 * 전제 조건: USE_SEAL(7) 상태 계약
 */
import { test } from '@playwright/test';
import { login }             from '../../actions/common/common.login.js';
import { gotoDetailOrFirst } from '../../actions/clm/clm.navigate.js';
import { requestEsign }      from '../../actions/clm/clm.esign.js';

test('[TC-CLM-S14] 전자서명 요청', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await requestEsign(page);
});
