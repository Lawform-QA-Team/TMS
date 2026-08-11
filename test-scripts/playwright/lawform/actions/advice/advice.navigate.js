/**
 * Advice 네비게이션 액션
 */
import { URLS } from '../../url_base_lawform.js';
import { hasRows, clickFirstRow } from '../common/common.table.js';

export async function gotoDraftList(page) {
    await page.goto(URLS.ADVICE.DRAFT);
    await page.waitForLoadState('networkidle');
}

export async function gotoReviewList(page) {
    await page.goto(URLS.ADVICE.REVIEW);
    await page.waitForLoadState('networkidle');
}

/** ADVICE_ID 환경변수가 있으면 직접 진입, 없으면 검토 목록 첫 번째 항목 */
export async function gotoDetailOrFirst(page) {
    const adviceId = process.env.ADVICE_ID;
    if (adviceId) {
        await page.goto(`${URLS.ADVICE.REVIEW}/${adviceId}`);
        await page.waitForLoadState('networkidle');
        return;
    }
    await gotoReviewList(page);
    if (!await hasRows(page)) throw new Error('[ADVICE] 검토 목록에 항목 없음');
    await clickFirstRow(page);
}
