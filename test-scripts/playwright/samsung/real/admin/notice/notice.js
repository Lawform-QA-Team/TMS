/**
 * 공지사항 - Playwright용
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
  await wait(3000);
  let timestamp = getNewTimeStamp();
  console.log('LOGIN SUCCESS URL:', await page.url());
  await page.screenshot({ path: `screenshots/${timestamp}_login_success.png` });

  await page.goto(URLS.SERVICE.NOTICE);
  await page.waitForLoadState('load');
  await wait(5000);
  console.log('NOTICE URL:', await page.url());
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_notice.png` });

  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_LAST);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_pagination_last.png` });
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.ADMIN.NOTICE.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.NOTICE.INPUT_SEARCH).fill('공지사항');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(5000);
  await page.screenshot({ path: `screenshots/${timestamp}_search.png` });

  await page.goto(URLS.SERVICE.NOTICE);
  await page.waitForSelector(SELECTORS.ADMIN.NOTICE.REGISTER);
  await page.click(SELECTORS.ADMIN.NOTICE.REGISTER);
  await wait(1000);
  console.log('NOTICE REGISTER SUCCESS URL:', await page.url());
  await page.screenshot({ path: `screenshots/${timestamp}_register.png` });
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
  await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);

  await page.waitForSelector(SELECTORS.ADMIN.NOTICE.REGISTER);
  await page.click(SELECTORS.ADMIN.NOTICE.REGISTER);
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.INPUT_TITLE);
  await page.locator(SELECTORS.FEATURES.NOTICE.INPUT_TITLE).fill('공지사항 테스트');
  await page.waitForSelector('[contenteditable="true"]');
  await page.locator('[contenteditable="true"]').first().fill('문의 테스트 1');
  await page.keyboard.press('Enter');
  await page.locator('[contenteditable="true"]').first().type('문의 테스트 2');
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_register_write.png` });
}
