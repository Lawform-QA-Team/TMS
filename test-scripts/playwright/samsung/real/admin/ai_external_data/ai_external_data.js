/**
 * AI 외부 데이터 관리 (법령) - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

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

  await page.goto(URLS.AI_DATA.LAW, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA.png` });

  // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH).fill('고시');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/ai-external-data**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_search.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH).fill('');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/ai-external-data**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);

  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.TABLE_LIST);
  await Promise.all([
    page.waitForURL('**/ai-external-data**'),
    page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_table.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
  await page.locator(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH).click({ force: true });
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_VIEW);
  const views = await page.locator(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_VIEW).all();
  if (views.length >= 2) {
      await views[Math.floor(Math.random() * (views.length - 1)) + 1].click();
  }
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_table_detail.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);
  await Promise.all([
    page.waitForURL('**/ai-external-data**'),
    page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST),
  ]);

  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_checkbox.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);

  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_delete.png` });
}
