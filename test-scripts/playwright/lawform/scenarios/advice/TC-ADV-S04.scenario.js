/**
 * TC-ADV-S04: 신규 자문 요청 — 지재권 분류 선택
 */
import { test } from '@playwright/test';
import { login }                 from '../../actions/common/common.login.js';
import { gotoDraftList }         from '../../actions/advice/advice.navigate.js';
import { clickNewAdviceRequest,
         selectAdviceType }      from '../../actions/advice/advice.draft.js';

test('[TC-ADV-S04] 신규 자문 요청 — 지재권(pi) 분류 선택', async ({ page }) => {
    await login(page);
    await gotoDraftList(page);
    await clickNewAdviceRequest(page);
    await selectAdviceType(page, 'pi');
});
