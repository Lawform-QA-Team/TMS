/**
 * 법률 자문 요청 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 자문 초안 목록 진입
 * 2. 신규 자문 요청 버튼 클릭
 * 3. ADVICE_TYPE 환경변수에 따라 자문 분류 선택
 *
 * ENV:
 *   ADVICE_TYPE = pi | cn | ft | ma | ci | tl | la | hr | cole | overle
 *                (지재권 | 계약 | 금융 | M&A | 공정거래 | 조세/노무 | 법률자문 | 인사 | 법인 | 해외)
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

const ADVICE_TYPE_LABELS = {
    pi: '지재권',
    cn: '계약',
    ft: '금융',
    ma: 'M&A',
    ci: '공정거래',
    tl: '조세',
    la: '법률자문',
    hr: '인사',
    cole: '법인',
    overle: '해외'
};

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');
    const adviceType = process.env.ADVICE_TYPE;

    await loginWithPage(page, credentials);

    // ── 1. 자문 초안 목록 진입 ────────────────────────────────────────
    await page.goto(URLS.ADVICE.DRAFT);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_advice_draft.png` });

    // ── 2. 신규 자문 요청 클릭 ────────────────────────────────────────
    await page.waitForSelector('//button[text()="신규 자문 요청" and not(@disabled)]');
    await page.locator('//button[text()="신규 자문 요청"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `screenshots/${ts()}_advice_draft_request_click.png` });

    // ── 3. 확인 모달 처리 ─────────────────────────────────────────────
    const confirmModal = page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인" and not(@disabled)]');
    if (await confirmModal.isVisible()) {
        await confirmModal.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `screenshots/${ts()}_advice_draft_after_confirm.png` });
    }

    // ── 4. 자문 분류 선택 ─────────────────────────────────────────────
    if (adviceType && ADVICE_TYPE_LABELS[adviceType]) {
        const label = ADVICE_TYPE_LABELS[adviceType];
        const typeOption = page.locator(`text="${label}"`).first();
        if (await typeOption.isVisible({ timeout: 5000 }).catch(() => false)) {
            await typeOption.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: `screenshots/${ts()}_advice_draft_type_${adviceType}.png` });
        } else {
            console.log(`[advice_draft] 자문 분류 옵션 미노출: ${label}`);
        }
    } else if (adviceType) {
        console.log(`[advice_draft] 알 수 없는 ADVICE_TYPE: ${adviceType}`);
    } else {
        // 뒤로가기 (분류 미선택)
        const backBtn = page.locator('//img[@alt="arrow"]').first();
        if (await backBtn.isVisible()) {
            await backBtn.click();
        }
    }

    await page.screenshot({ path: `screenshots/${ts()}_advice_draft_done.png` });
}
