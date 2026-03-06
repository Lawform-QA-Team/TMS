/**
 * 표준 양식 카테고리 관리 - Playwright용
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

  await page.goto(URLS.AUTODOC.CATEGORY);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category.png` });
  await wait(5000);

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH).fill('카테고리');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_search.png` });
  await page.goto(URLS.AUTODOC.CATEGORY);

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT);
  await page.locator(SELECTORS.ADMIN.AUTODOC.INPUT).fill('카테고리 등록 테스트');
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register_write.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register_save.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_table.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT);
  await page.locator(SELECTORS.ADMIN.AUTODOC.INPUT).fill('카테고리 수정');
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_edit_category.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_edit_category_save.png` });
}
