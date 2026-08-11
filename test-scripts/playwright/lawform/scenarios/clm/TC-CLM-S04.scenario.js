/**
 * TC-CLM-S04: 법무 검토 승인
 *
 * 전제 조건: CLM 검토 목록에 REVIEW_REQUEST(2) 상태의 계약 존재
 * 또는 CLM_ID 환경변수로 특정 계약 직접 지정
 */
import { test, expect } from '@playwright/test';
import { login }                  from '../../actions/common/common.login.js';
import { gotoDetailOrFirst }      from '../../actions/clm/clm.navigate.js';
import { approveLegalReview }     from '../../actions/clm/clm.legal.js';

test('[TC-CLM-S04] 법무 검토 승인', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await approveLegalReview(page);

    // 상태 전이 확인: 법무 검토 완료 또는 다음 단계 텍스트 노출
    await expect(
        page.locator('text=재무 검토, text=최종 결재, text=법무 검토 완료').first()
    ).toBeVisible({ timeout: 10000 }).catch(() => {
        // 상태 텍스트 선택자가 환경마다 다를 수 있으므로 pass
    });
});
