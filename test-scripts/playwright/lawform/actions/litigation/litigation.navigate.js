/**
 * Litigation 네비게이션 액션
 */
import { URLS } from '../../url_base_lawform.js';
import { hasRows, clickFirstRow } from '../common/common.table.js';

export async function gotoDraftList(page) {
    await page.goto(URLS.LITIGATION.DRAFT);
    await page.waitForLoadState('networkidle');
}

export async function gotoReviewList(page) {
    await page.goto(URLS.LITIGATION.REVIEW);
    await page.waitForLoadState('networkidle');
}

export async function gotoScheduleAll(page) {
    await page.goto(URLS.LITIGATION.SCHEDULE);
    await page.waitForLoadState('networkidle');
}

/** LITIGATION_ID 환경변수가 있으면 직접 진입, 없으면 목록 첫 번째 항목 */
export async function gotoDetailOrFirst(page) {
    const litigationId = process.env.LITIGATION_ID;
    if (litigationId) {
        await page.goto(`${URLS.LITIGATION.REVIEW}/${litigationId}`);
        await page.waitForLoadState('networkidle');
        return;
    }
    await gotoReviewList(page);
    if (!await hasRows(page)) throw new Error('[LITIGATION] 목록에 항목 없음');
    await clickFirstRow(page);
}
