/**
 * Advice 초안 액션
 */

const ADVICE_TYPE_LABELS = {
    pi: '지재권', cn: '계약', ft: '금융', ma: 'M&A',
    ci: '공정거래', tl: '조세', la: '법률자문', hr: '인사',
    cole: '법인', overle: '해외',
};

/** 신규 자문 요청 버튼 클릭 + 확인 모달 */
export async function clickNewAdviceRequest(page) {
    await page.waitForSelector('//button[text()="신규 자문 요청" and not(@disabled)]');
    await page.locator('//button[text()="신규 자문 요청"]').click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인" and not(@disabled)]');
    if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
    }
    await page.waitForLoadState('networkidle');
}

/**
 * 자문 분류 선택
 * @param {import('@playwright/test').Page} page
 * @param {'pi'|'cn'|'ft'|'ma'|'ci'|'tl'|'la'|'hr'|'cole'|'overle'} type
 */
export async function selectAdviceType(page, type) {
    const label = ADVICE_TYPE_LABELS[type];
    if (!label) throw new Error(`[ADVICE] 알 수 없는 type: ${type}`);
    const option = page.locator(`text="${label}"`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    await page.waitForTimeout(500);
}
