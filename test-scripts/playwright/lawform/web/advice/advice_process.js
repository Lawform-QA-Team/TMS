/**
 * 법률 자문 전체 프로세스 오케스트레이터 - Playwright E2E
 *
 * ADVICE_PROGRESS 값에 따라 해당 단계 핸들러를 실행한다.
 *
 *   1 = DRAFT     → 신규 자문 요청 작성
 *   2 = REVIEW    → 자문 코멘트 추가 (검토 진행)
 *   3 = COMPLETE  → 법무 자문 완료 처리 (승인/반려)
 *
 * ENV:
 *   ADVICE_PROGRESS = 1~3  (필수)
 *   + 각 단계 핸들러 ENV (ADVICE_TYPE, COMMENT_TEXT, APPROVE_TYPE, DENY_REASON, ADVICE_ID)
 */
import { run as runDraft } from './advice_draft.js';
import { run as runAddComent } from './advice_add_coment.js';
import { run as runLagel } from './advice_lagel.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const adviceProgress = process.env.ADVICE_PROGRESS;

    if (!adviceProgress) {
        console.error('[advice_process] ADVICE_PROGRESS 환경변수가 필요합니다 (1~3)');
        return;
    }

    switch (adviceProgress) {
        case '1':
            // 신규 자문 요청 작성
            await runDraft(page);
            break;

        case '2':
            // 검토 중 코멘트 추가
            await runAddComent(page);
            break;

        case '3':
            // 자문 완료 처리 (승인/반려)
            await runLagel(page);
            break;

        default:
            console.error(`[advice_process] 알 수 없는 ADVICE_PROGRESS 값: ${adviceProgress}`);
    }
}
