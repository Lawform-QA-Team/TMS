/**
 * TC-CLM-S13: 인감 반려
 */
import { test } from '@playwright/test';
import { login }      from '../../actions/common/common.login.js';
import { denySeal }   from '../../actions/clm/clm.seal.js';

test('[TC-CLM-S13] 인감 반려', async ({ page }) => {
    await login(page);
    await denySeal(page, '자동화 테스트 인감 반려 사유');
});
