/**
 * 공지사항 (웹) - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../admin/login/login_helper.js';

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

  await page.goto(URLS.SERVICE.NOTICE);
  await wait(5000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE.png` });

  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_LAST);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_pagination_last.png` });
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.WEB.NOTICE.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.NOTICE.INPUT_SEARCH).fill('공지');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_search.png` });
  await page.goto(URLS.SERVICE.NOTICE);

  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_table.png` });

  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
  await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history.png` });
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
  await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
}
