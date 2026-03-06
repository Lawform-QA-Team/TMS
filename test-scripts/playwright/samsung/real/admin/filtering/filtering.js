/**
 * 필터링 관리 - Playwright용
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

  await page.goto(URLS.FILTERING.FILTERING);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING.png` });
  await wait(5000);

  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_LAST);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_pagination_last.png` });
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.FILTERING.INPUT_SEARCH).fill('필터');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_search.png` });

  await page.goto(URLS.FILTERING.FILTERING);
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
  await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register.png` });
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_CLOSE);

  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
  await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT);
  await page.locator(SELECTORS.ADMIN.FILTERING.INPUT).fill('필터링 단어 테스트');
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_1);
  await page.locator(SELECTORS.ADMIN.FILTERING.INPUT_1).fill('필터링 사유 테스트');
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_write.png` });
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
  await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_submit.png` });

  await page.waitForSelector(SELECTORS.COMMON.TABLE);
  await page.click(`${SELECTORS.COMMON.TABLE} button`);
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT);
  await page.locator(SELECTORS.ADMIN.FILTERING.INPUT).fill('필터링 단어 테스트 2');
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_1);
  await page.locator(SELECTORS.ADMIN.FILTERING.INPUT_1).fill('필터링 사유 테스트 2');
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.SWITCH);
  await page.click(SELECTORS.ADMIN.FILTERING.SWITCH);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_edit.png` });
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
  await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_edit_submit.png` });
}
