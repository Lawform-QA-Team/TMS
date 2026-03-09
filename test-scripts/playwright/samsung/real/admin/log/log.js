/**
 * 로그 - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';

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

  await page.goto(URLS.LOG.LOG);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_LOG.png` });
  await wait(2000);

  await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_LAST);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_LOG_pagination_last.png` });
  await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.BUTTON);
  const buttons = page.locator(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.BUTTON);
  const count = await buttons.count();
  await buttons.nth(Math.floor(Math.random() * count)).click();
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_LOG_date.png` });

  await selectComboboxOption(page, SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_EVENT);
  await selectComboboxOption(page, SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_STATUS);
  await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.INPUT_SEARCH).fill('a');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_LOG_search.png` });
}
