/**
 * TC-CLM-S12: 인감 승인
 *
 * 전제 조건: 인감 검토 목록에 신청 건 존재
 */
import { test } from '@playwright/test';
import { login }        from '../../actions/common/common.login.js';
import { approveSeal }  from '../../actions/clm/clm.seal.js';

test('[TC-CLM-S12] 인감 승인', async ({ page }) => {
    await login(page);
    await approveSeal(page);
});
