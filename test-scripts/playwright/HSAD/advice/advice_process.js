/**
 * 법률 자문 전체 프로세스 - Playwright용
 */
import { run as runDraft } from './advice_draft.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    await runDraft(page);
    // TODO: 자문 전체 프로세스 추가 단계 구현
}
