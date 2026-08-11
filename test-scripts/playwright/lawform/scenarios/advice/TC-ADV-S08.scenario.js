/**
 * TC-ADV-S08: 자문 전체 프로세스 — 요청 단계
 *
 * 신규 자문 요청 버튼 클릭 후 폼 진입까지 확인
 */
import { test, expect } from '@playwright/test';
import { login }                 from '../../actions/common/common.login.js';
import { gotoDraftList }         from '../../actions/advice/advice.navigate.js';
import { clickNewAdviceRequest } from '../../actions/advice/advice.draft.js';

test('[TC-ADV-S08] 자문 프로세스 — 신규 요청 단계', async ({ page }) => {
    await login(page);
    await gotoDraftList(page);
    await expect(page).toHaveURL(/\/advice\/draft/);
    await clickNewAdviceRequest(page);
});
