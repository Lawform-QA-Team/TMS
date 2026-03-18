/**
 * IP 관리 - Playwright용
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

  await page.goto(URLS.SERVICE.IP);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_IP.png` });
  await page.waitForLoadState('load');

  await page.waitForSelector(SELECTORS.ADMIN.IP_MANAGEMENT.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.IP_MANAGEMENT.INPUT_SEARCH).fill('5');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await page.waitForLoadState('load');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_IP_search.png` });
}
