/**
 * TC-CLM-S15: 전자서명 현황 확인
 */
import { test, expect } from '@playwright/test';
import { login }               from '../../actions/common/common.login.js';
import { gotoDetailOrFirst }   from '../../actions/clm/clm.navigate.js';
import { checkEsignStatus }    from '../../actions/clm/clm.esign.js';

test('[TC-CLM-S15] 전자서명 현황 확인', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await checkEsignStatus(page);
    await expect(page.locator('text=전자서명').first()).toBeVisible();
});
