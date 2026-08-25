/**
 * TC-SEAL-S02: 인감 신규 등록 — 날짜 / 담당자 / 첨부파일 영역 확인
 */
import { test } from '@playwright/test';
import { login }                   from '../../actions/common/common.login.js';
import { gotoDraftList }           from '../../actions/seal/seal.navigate.js';
import { clickNewSealButton,
         assertDateInputVisible,
         assertContactInputVisible,
         assertAttachmentVisible }  from '../../actions/seal/seal.draft.js';

test('[TC-SEAL-S02] 인감 신규 등록 폼 진입 — 필수 영역 확인', async ({ page }) => {
    await login(page);
    await gotoDraftList(page);
    await clickNewSealButton(page);
    await assertDateInputVisible(page);
    await assertContactInputVisible(page);
    await assertAttachmentVisible(page);
});
