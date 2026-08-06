/**
 * 서비스 - 통합검색 (웹) - Playwright용
 */
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getWebCredentials, loginWebWithPage } from '../../admin/login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { selectDateRangeInRdpCalendar } from '../../../../common/datepicker_helper.js';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
  const credentials = getWebCredentials();
  const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

  await loginWebWithPage(page, credentials);

  // 통합검색
  await page.waitForSelector(SELECTORS.WEB.NAVBAR.INPUT);
  await page.locator(SELECTORS.WEB.NAVBAR.INPUT).fill('테스트');
  await Promise.all([
    page.waitForURL('**/search**'),
    page.keyboard.press('Enter'),
  ]);
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SEARCH.png` });

  // 통합검색, 페이지네이션
  // await page.waitForSelector(SELECTORS.WEB.SEARCH.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_SEARCH_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.WEB.SEARCH.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 통합검색, 검색 필터 적용
  await selectComboboxOption(page, SELECTORS.WEB.SEARCH.SELECT)
  await page.waitForSelector(SELECTORS.WEB.SEARCH.INPUT);
  await page.fill(SELECTORS.WEB.SEARCH.INPUT, 'ggp');
  await page.waitForSelector(SELECTORS.WEB.SEARCH.DATEPICKER);
  await page.waitForSelector(SELECTORS.WEB.SEARCH.DATEPICKER_START);
  await selectDateRangeInRdpCalendar(page, SELECTORS.WEB.SEARCH.DATEPICKER, SELECTORS.WEB.SEARCH.DATEPICKER_START, '2026-01-01', '2026-03-19')
  await page.waitForSelector(SELECTORS.WEB.SEARCH.BUTTON_FILTER_SEARCH);
  await Promise.all([
    page.waitForURL('**/search**'),
    page.click(SELECTORS.WEB.SEARCH.BUTTON_FILTER_SEARCH),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SEARCH_filter.png` });
  await page.waitForSelector(SELECTORS.WEB.SEARCH.SELECT);
  await page.locator(SELECTORS.WEB.SEARCH.SELECT).click();
  const selectOption = page.locator('[role="option"]').filter({ hasText: '전체' });
  await selectOption.click();
  await page.waitForSelector(SELECTORS.WEB.SEARCH.INPUT);
  await page.fill(SELECTORS.WEB.SEARCH.INPUT, '테스트');
  await page.waitForSelector(SELECTORS.WEB.SEARCH.BUTTON_FILTER_SEARCH);
  await Promise.all([
    page.waitForURL('**/search**'),
    page.click(SELECTORS.WEB.SEARCH.BUTTON_FILTER_SEARCH),
  ]);

  // 통합검색, 검색 결과 클릭
  await page.waitForSelector('button.text-base.font-semibold.text-foreground.cursor-pointer.text-left');
  const results = page.locator('button.text-base.font-semibold.text-foreground.cursor-pointer.text-left');
  await Promise.all([
    page.waitForURL('**/autodoc**'),
    results.nth(0).click(),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SEARCH_result.png` });
}
