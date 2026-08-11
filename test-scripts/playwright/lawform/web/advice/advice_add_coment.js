/**
 * 법률 자문 코멘트 추가 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 자문 검토 목록 진입
 * 2. 첫 번째 항목 클릭 → 상세 진입
 * 3. 코멘트 입력 영역 확인 및 코멘트 작성
 *
 * ENV:
 *   COMMENT_TEXT = 입력할 코멘트 내용 (default: '검토 의견 작성 테스트')
 *   ADVICE_ID    = 자문 ID (지정 시 해당 URL로 직접 진입)
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');
    const commentText = process.env.COMMENT_TEXT ?? '검토 의견 작성 테스트';
    const adviceId = process.env.ADVICE_ID;

    await loginWithPage(page, credentials);

    // ── 1. 자문 상세 진입 ─────────────────────────────────────────────
    if (adviceId) {
        await page.goto(`${URLS.ADVICE.REVIEW}/${adviceId}`);
        await page.waitForLoadState('networkidle');
    } else {
        await page.goto(URLS.ADVICE.REVIEW);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_advice_review_list.png` });

        const firstRow = page.locator('table tbody tr').first();
        if (!await firstRow.isVisible()) {
            console.log('[advice_add_coment] 자문 목록에 항목 없음 — 스킵');
            return;
        }
        await firstRow.click();
        await page.waitForLoadState('networkidle');
    }
    await page.screenshot({ path: `screenshots/${ts()}_advice_detail.png` });

    // ── 2. 코멘트 입력 영역 찾기 ─────────────────────────────────────
    const commentInput = page.locator('textarea[placeholder*="의견"], textarea[placeholder*="코멘트"], textarea').first();
    if (!await commentInput.isVisible()) {
        console.log('[advice_add_coment] 코멘트 입력 영역 없음 — 스킵');
        return;
    }

    // ── 3. 코멘트 작성 및 제출 ────────────────────────────────────────
    await commentInput.click();
    await commentInput.fill(commentText);
    await page.screenshot({ path: `screenshots/${ts()}_advice_comment_input.png` });

    const submitBtn = page.locator('button:has-text("등록"), button:has-text("저장"), button:has-text("확인")').first();
    if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `screenshots/${ts()}_advice_comment_done.png` });
    } else {
        console.log('[advice_add_coment] 코멘트 제출 버튼 없음');
    }
}
