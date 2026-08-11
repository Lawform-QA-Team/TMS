/**
 * CLM 네비게이션 액션
 */
import { URLS } from '../../url_base_lawform.js';
import { clickFirstRow, hasRows } from '../common/common.table.js';

export async function gotoDraftList(page) {
    await page.goto(URLS.CLM.DRAFT);
    await page.waitForLoadState('networkidle');
}

export async function gotoReviewList(page) {
    await page.goto(URLS.CLM.REVIEW);
    await page.waitForLoadState('networkidle');
}

export async function gotoCompleteList(page) {
    await page.goto(URLS.CLM.COMPLETE);
    await page.waitForLoadState('networkidle');
}

export async function gotoSearchPage(page) {
    await page.goto(URLS.CLM.SEARCH);
    await page.waitForLoadState('networkidle');
}

/** CLM_ID 환경변수가 있으면 직접 진입, 없으면 검토 목록 첫 번째 항목으로 진입 */
export async function gotoDetailOrFirst(page) {
    const clmId = process.env.CLM_ID;
    if (clmId) {
        await page.goto(`${URLS.CLM.REVIEW}/${clmId}`);
        await page.waitForLoadState('networkidle');
        return;
    }
    await gotoReviewList(page);
    if (!await hasRows(page)) {
        throw new Error('[CLM] 검토 목록에 항목이 없습니다');
    }
    await clickFirstRow(page);
}
