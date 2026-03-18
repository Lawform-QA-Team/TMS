/**
 * 로그 - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { selectDateRangeInRdpCalendar } from '../../../../common/datepicker_helper.js';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
  const credentials = getCredentials();
  const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

  await loginWithPage(page, credentials);

  // 로그
  await page.goto(URLS.LOG.LOG);
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_LOG.png` });

  // 로그, 페이지네이션
  // await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_LOG_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 로그, 일시 설정
  await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.BUTTON);
  const buttons = page.locator(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.BUTTON);
  const count = await buttons.count();
  await buttons.nth(Math.floor(Math.random() * count)).click();
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_LOG_date.png` });

  // 로그, 검색
  await page.waitForLoadState('load');
  const datepickers = await page.$$('button[data-slot="popover-trigger"]');
  await selectDateRangeInRdpCalendar(page, datepickers[0], datepickers[1], '2026-02-01', '2026-02-28');
  await selectComboboxOption(page, SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_EVENT);
  await selectComboboxOption(page, SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_STATUS);
  await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.INPUT_SEARCH).fill('a');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_LOG_search.png` });
  await page.goto(URLS.LOG.LOG);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL('**/log**', { waitUntil: 'domcontentloaded' });

  // 로그, 검색 -> AI 채팅
  await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_EVENT);
  await page.locator(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_EVENT).click();
  const aiChatOption = page.locator('[role="option"]').filter({ hasText: 'AI 채팅' });
  await aiChatOption.click();
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.TABLE_LIST);
  await page.click(`${SELECTORS.COMMON.TABLE} span.cursor-pointer`);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_LOG_ai.png` });
}
