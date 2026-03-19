/**
 * 사용자 관리 (백오피스) - Playwright용
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

  await page.goto(URLS.MEMBER.BACKOFFICE, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE.png` });

  // await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH).fill('임희건');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/members**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_search.png` });

  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.TABLE_LIST);
  await page.click(`${SELECTORS.COMMON.TABLE} button`);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_table.png` });

  await page.locator(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO).first().click();
  await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_2);
  await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_2);
  await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.CHECKBOX);
  const checkboxes = page.locator(SELECTORS.ADMIN.USER_DETAIL_PANEL.CHECKBOX);
  const count = await checkboxes.count();
  for (let i = 0; i <= Math.min(3, count - 1); i++) {
    await checkboxes.nth(i).click();
  }
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_edit.png` });

  await page.locator(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO).nth(2).click();
  await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_1);
  await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_1);
  await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.BUTTON_SAVE);
  await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.BUTTON_SAVE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_save.png` });
}
