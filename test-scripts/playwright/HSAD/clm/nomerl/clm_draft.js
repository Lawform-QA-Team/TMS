/**
 * CLM 계약 검토 요청 라우터 (DRAFT_TYPE에 따라 분기) - Playwright용
 */
import { run as runNew } from './clm_draft.new.js';
import { run as runChange } from './clm_draft.change.js';
import { run as runStop } from './clm_draft.stop.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const draftType = process.env.DRAFT_TYPE;

    if (draftType === 'new') {
        await runNew(page);
    } else if (draftType === 'change') {
        await runChange(page);
    } else if (draftType === 'stop') {
        await runStop(page);
    } else {
        throw new Error(`DRAFT_TYPE 환경변수 필요: new | change | stop (현재값: ${draftType})`);
    }
}
