/**
 * 로그아웃 - Playwright용
 */
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from './login_helper.js';

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
  const timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_login_success.png` });
  console.log('URL:', await page.url());
  await page.locator(SELECTORS.COMMON.LOGOUT).waitFor({ state: 'visible' });
  await page.locator(SELECTORS.COMMON.LOGOUT).click();
  const timestampAfter = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestampAfter}_logout_success.png` });
}
