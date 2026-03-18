/**
 * 1:1 문의 관리 - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';

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

  await page.goto(URLS.SERVICE.QNA);
  await page.waitForLoadState('load');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_qna.png` });

  // await page.waitForSelector(SELECTORS.COMMON.PAGE_LAST);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('load');
  // await page.screenshot({ path: `screenshots/${timestamp}_qna_page_last.png` });
  // await page.waitForSelector(SELECTORS.COMMON.PAGE_FIRST);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);
  // await page.waitForLoadState('load');
  // await page.screenshot({ path: `screenshots/${timestamp}_qna_page_first.png` });

  await selectComboboxOption(page, SELECTORS.ADMIN.QNA.SELECT_ANSWER_STATUS);
  await page.waitForSelector(SELECTORS.ADMIN.QNA.INPUT_SEARCH);
  await page.waitForLoadState('load');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_qna_status.png` });

  await page.locator(SELECTORS.ADMIN.QNA.INPUT_SEARCH).fill('문의');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await page.waitForLoadState('load');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_qna_search.png` });
  await page.goto(URLS.SERVICE.QNA);
  await page.waitForLoadState('load');
  await page.waitForURL('**/qna**', { waitUntil: 'load' });

  await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await page.waitForLoadState('load');
  await page.screenshot({ path: `screenshots/${timestamp}_qna_table.png` });
  await page.waitForSelector(SELECTORS.ADMIN.QNA.BUTTON_LIST);
  await page.click(SELECTORS.ADMIN.QNA.BUTTON_LIST);

  await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await page.waitForSelector('[contenteditable="true"]');
  await page.locator('[contenteditable="true"]').first().fill('문의 테스트 1');
  await page.keyboard.press('Enter');
  await page.locator('[contenteditable="true"]').first().type('문의 테스트 2');
  await page.waitForLoadState('load');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_qna_answer_write.png` });

  await page.waitForSelector(SELECTORS.ADMIN.QNA.BUTTON_SAVE);
  await page.click(SELECTORS.ADMIN.QNA.BUTTON_SAVE);
  await page.goto(URLS.SERVICE.QNA);
  await page.waitForLoadState('load');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_qna_answer_submit.png` });
}
