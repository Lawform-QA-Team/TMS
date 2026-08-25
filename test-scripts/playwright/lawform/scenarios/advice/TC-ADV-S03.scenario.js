/**
 * TC-ADV-S03: 신규 자문 요청 — 계약 분류 선택
 */
import { test } from '@playwright/test';
import { login }                 from '../../actions/common/common.login.js';
import { gotoDraftList }         from '../../actions/advice/advice.navigate.js';
import { clickNewAdviceRequest,
         selectAdviceType }      from '../../actions/advice/advice.draft.js';

test('[TC-ADV-S03] 신규 자문 요청 — 계약(cn) 분류 선택', async ({ page }) => {
    await login(page);
    await gotoDraftList(page);
    await clickNewAdviceRequest(page);
    await selectAdviceType(page, 'cn');
});
