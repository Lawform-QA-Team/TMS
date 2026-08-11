/**
 * Seal 네비게이션 액션
 */
import { URLS } from '../../url_base_lawform.js';
import { hasRows, clickFirstRow } from '../common/common.table.js';

export async function gotoReviewList(page) {
    await page.goto(URLS.SEAL.REVIEW);
    await page.waitForLoadState('networkidle');
}

export async function gotoLedger(page) {
    await page.goto(URLS.SEAL.LEDGER);
    await page.waitForLoadState('networkidle');
}

export async function gotoDraftList(page) {
    await page.goto(URLS.SEAL.DRAFT);
    await page.waitForLoadState('networkidle');
}

export async function gotoDetailOrFirst(page) {
    await gotoReviewList(page);
    if (!await hasRows(page)) throw new Error('[SEAL] 인감 검토 목록에 항목 없음');
    await clickFirstRow(page);
}
