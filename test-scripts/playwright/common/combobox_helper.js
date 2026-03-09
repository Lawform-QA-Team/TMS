/**
 * Combobox 공통 헬퍼 (Playwright)
 * button + role="combobox" 패턴의 커스텀 드롭다운 처리
 */

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Combobox (button + role="combobox")에서 랜덤 옵션 선택
 * @param {import('@playwright/test').Page} page - Playwright page 객체
 * @param {string} comboboxSelector - combobox 트리거 셀렉터 (data-tid 등)
 * @param {object} opts - 옵션
 * @param {number} opts.timeout - 옵션 대기 타임아웃 (ms), 기본 3000
 * @returns {Promise<string|null>} - 선택된 옵션의 텍스트
 */
export async function selectComboboxOption(page, comboboxSelector, opts = {}) {
  const { timeout = 3000 } = opts;
  await page.locator(comboboxSelector).click();
  await wait(300);

  const optionsLocator = page.locator('[role="option"]');
  try {
    await optionsLocator.first().waitFor({ state: 'visible', timeout });
  } catch {
    const liLocator = page.locator('[role="listbox"] li, [role="listbox"] [role="option"]');
    await liLocator.first().waitFor({ state: 'visible', timeout: timeout - 1000 });
    const count = await liLocator.count();
    if (count === 0) return null;
    const idx = Math.floor(Math.random() * count);
    const selectedText = await liLocator.nth(idx).textContent();
    await liLocator.nth(idx).click();
    await wait(200);
    return selectedText ? selectedText.trim() : null;
  }

  const count = await optionsLocator.count();
  if (count === 0) return null;
  const idx = Math.floor(Math.random() * count);
  const selectedText = await optionsLocator.nth(idx).textContent();
  await optionsLocator.nth(idx).click();
  await wait(200);
  return selectedText ? selectedText.trim() : null;
}
