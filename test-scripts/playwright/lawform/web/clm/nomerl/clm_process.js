/**
 * CLM 계약 진행 처리 오케스트레이터 - Playwright E2E
 *
 * CLM_PROGRESS 값에 따라 해당 단계 핸들러를 실행한다.
 *
 *   1 = DRAFT → 초안 작성 (신규 검토 요청 제출)
 *   2 = REVIEW_REQUEST → 법무 검토 (승인/반려)
 *   3 = LEGAL_REVIEW_COMPLETE → 재무검토 요청
 *   4 = FINANCIAL_REVIEW → 재무 검토 (승인/반려)
 *   5 = FINANCIAL_REVIEW_COMPLETE → 최종 승인/반려
 *   6 = FINAL_APPROVAL → 인감사용 신청/승인/반려
 *   7 = USE_SEAL → 전자서명 요청/확인
 *
 * ENV:
 *   CLM_PROGRESS = 1~7  (필수)
 *   + 각 단계 핸들러 ENV (APPROVE_TYPE, DENY_REASON, SEAL_ACTION, ESIGN_ACTION, CLM_ID)
 */
import { run as runNewDraft } from './clm_draft.new.js';
import { run as runLagel } from './clm_lagel.js';
import { run as runFinancial } from './clm_financial.js';
import { run as runFinal } from './clm_final.js';
import { run as runSeal } from './clm_seal.js';
import { run as runEsign } from './clm_esign.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const clmProgress = process.env.CLM_PROGRESS;

    if (!clmProgress) {
        console.error('[clm_process] CLM_PROGRESS 환경변수가 필요합니다 (1~7)');
        return;
    }

    switch (clmProgress) {
        case '1':
            // 초안 작성 → 신규 검토 요청 제출
            await runNewDraft(page);
            break;

        case '2':
            // 법무 검토 (승인 또는 반려)
            await runLagel(page);
            break;

        case '3':
            // 법무 검토 완료 → 재무검토 요청
            process.env.APPROVE_TYPE = process.env.APPROVE_TYPE ?? 'request';
            await runFinancial(page);
            break;

        case '4':
            // 재무 검토 (승인 또는 반려)
            await runFinancial(page);
            break;

        case '5':
            // 재무 검토 완료 → 최종 승인/반려
            await runFinal(page);
            break;

        case '6':
            // 최종 승인 → 인감사용 신청/승인/반려
            await runSeal(page);
            break;

        case '7':
            // 인감 날인 완료 → 전자서명 요청/확인
            await runEsign(page);
            break;

        default:
            console.error(`[clm_process] 알 수 없는 CLM_PROGRESS 값: ${clmProgress}`);
    }
}
