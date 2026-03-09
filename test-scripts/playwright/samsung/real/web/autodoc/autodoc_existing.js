/**
 * 문서 작성 - 기존 문서 (웹) - Playwright용
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

  await page.goto(URLS.AUTODOC.EXISTING);
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing.png` });

  await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_LAST);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_pagination_last.png` });
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.AUTODOC.INPUT_SEARCH).fill('테스트');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_search.png` });
  await page.goto(URLS.AUTODOC.EXISTING);

  await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_table.png` });

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_download.png` });

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD_1);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD_1);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_clean_download.png` });

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await wait(1000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_save.png` });

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await wait(1000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_tracking.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE2);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_table.png` });

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_COMPARE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_COMPARE);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_compare.png` });

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
}
