/**
 * 문서 작성 - 임시 저장 문서 (웹) - Playwright용
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

  await page.goto(URLS.AUTODOC.TEMP);
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp.png` });

  await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_LAST);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_pagination_last.png` });
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.AUTODOC.INPUT_SEARCH).fill('테스트');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_search.png` });
  await page.goto(URLS.AUTODOC.TEMP);

  await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_table.png` });

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_PREVIEW);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_PREVIEW);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_preview.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_label.png` });

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await wait(1000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_submit.png` });
}
