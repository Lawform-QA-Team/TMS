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

  await page.goto(URLS.SERVICE.QNA, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_qna.png` });

  // await page.waitForSelector(SELECTORS.COMMON.PAGE_LAST);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // await page.screenshot({ path: `screenshots/${timestamp}_qna_page_last.png` });
  // await page.waitForSelector(SELECTORS.COMMON.PAGE_FIRST);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);
  // await page.waitForLoadState('domcontentloaded');
  // await page.screenshot({ path: `screenshots/${timestamp}_qna_page_first.png` });

  await Promise.all([
    page.waitForURL('**/qna**'),
    selectComboboxOption(page, SELECTORS.ADMIN.QNA.SELECT_ANSWER_STATUS),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_qna_status.png` });

  await page.waitForSelector(SELECTORS.ADMIN.QNA.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.QNA.INPUT_SEARCH).fill('문의');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/qna**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_qna_search.png` });
  await page.waitForSelector(SELECTORS.ADMIN.QNA.SELECT_ANSWER_STATUS);
  await page.locator(SELECTORS.ADMIN.QNA.SELECT_ANSWER_STATUS).click();
  const statusOption = page.locator('[role="option"]').filter({ hasText: '전체' });
  await statusOption.click();
  await page.waitForSelector(SELECTORS.ADMIN.QNA.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.QNA.INPUT_SEARCH).fill('');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/qna**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);

  await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
  await Promise.all([
    page.waitForURL('**/qna**'),
    page.click(SELECTORS.COMMON.TABLE),
  ]);
  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({ path: `screenshots/${timestamp}_qna_table.png` });
  await page.waitForSelector(SELECTORS.ADMIN.QNA.BUTTON_LIST);
  await Promise.all([
    page.waitForURL('**/qna**'),
    page.click(SELECTORS.ADMIN.QNA.BUTTON_LIST),
  ]);

  await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
  await Promise.all([
    page.waitForURL('**/qna**'),
    page.click(SELECTORS.COMMON.TABLE),
  ]);
  await page.waitForSelector('[contenteditable="true"]');
  await page.locator('[contenteditable="true"]').first().fill('문의 답변 테스트');
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_qna_answer_write.png` });

  await page.waitForSelector(SELECTORS.ADMIN.QNA.BUTTON_SAVE);
  await Promise.all([
    page.waitForURL('**/qna**'),
    page.click(SELECTORS.ADMIN.QNA.BUTTON_SAVE),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_qna_answer_submit.png` });
}
