/**
 * CLM 계약 진행 처리 - Playwright용
 */
import { run as runDraft } from './clm_draft.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    await runDraft(page);

    const clmProgress = process.env.CLM_PROGRESS;
    if (clmProgress === '1') {
        // TODO: 진행 단계 1 구현
    } else if (clmProgress === '2') {
        // TODO: 진행 단계 2 구현
    } else {
        // TODO: 기타 진행 단계 구현
    }
}
