/**
 * [Action] Advice — 초안 작성
 */

const ADVICE_TYPE_LABELS = {
    pi:    '개인정보',
    cn:    '계약',
    ft:    '공정거래',
    ma:    '인수합병',
    ci:    '기업일반',
    tl:    '조세',
    la:    '노동',
    hr:    '인사',
    cole:  '공동',
    overle:'해외',
    etc:   '기타',
};

function getEnv(key) {
    if (typeof __ENV !== 'undefined' && __ENV[key]) return __ENV[key];
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    return null;
}

/** 신규 자문 요청 버튼 클릭 → 확인 모달 */
export async function clickNewAdviceRequest(page) {
    await page.waitForSelector('//button[text()="신규 자문 요청" and not(@disabled)]');
    await page.locator('//button[text()="신규 자문 요청"]').click();
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인" and not(@disabled)]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await page.waitForTimeout(10000);
}

/**
 * 자문 분류 선택
 * @param {import('k6/browser').Page} page
 * @param {string} [type] - ADVICE_TYPE env 또는 파라미터
 */
export async function selectAdviceType(page, type) {
    const t = type || getEnv('ADVICE_TYPE') || 'etc';
    const label = ADVICE_TYPE_LABELS[t] || '기타';
    const arrowBtn = page.locator('//img[@alt="arrow"]').first();
    if (await arrowBtn.isVisible()) {
        await arrowBtn.click();
        await page.waitForTimeout(300);
    }
    const typeOption = page.locator(`//div[text()="${label}"]`).first();
    if (await typeOption.isVisible()) {
        await typeOption.click();
        await page.waitForTimeout(300);
    }
}
