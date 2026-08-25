/**
 * TC-ADV-S05: 자문 코멘트 추가
 *
 * 전제 조건: 검토 중인 자문 건 존재
 * 또는 ADVICE_ID 환경변수로 특정 자문 지정
 */
import { test } from '@playwright/test';
import { login }               from '../../actions/common/common.login.js';
import { gotoDetailOrFirst }   from '../../actions/advice/advice.navigate.js';
import { addComment }          from '../../actions/advice/advice.review.js';

test('[TC-ADV-S05] 자문 코멘트 추가', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await addComment(page, '자동화 테스트 코멘트입니다.');
});
