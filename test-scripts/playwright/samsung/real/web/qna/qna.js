/**
 * 1:1 문의 (웹) - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../admin/login/login_helper.js';
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
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_QNA.png` });

  await selectComboboxOption(page, SELECTORS.WEB.QNA.SELECT_STATUS);
  await page.waitForSelector(SELECTORS.WEB.QNA.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.QNA.INPUT_SEARCH).fill('문의');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_QNA_search.png` });
  await page.goto(URLS.SERVICE.QNA);

  await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_QNA_table.png` });

  await page.goto(URLS.SERVICE.QNA);
  await page.waitForSelector(SELECTORS.WEB.QNA.BUTTON_CREATE_QNA);
  await page.click(SELECTORS.WEB.QNA.BUTTON_CREATE_QNA);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_QNA_create.png` });
  await page.waitForSelector(SELECTORS.WEB.QNA.BUTTON_CANCEL);
  await page.click(SELECTORS.WEB.QNA.BUTTON_CANCEL);

  await page.waitForSelector(SELECTORS.WEB.QNA.BUTTON_CREATE_QNA);
  await page.click(SELECTORS.WEB.QNA.BUTTON_CREATE_QNA);
  await page.waitForSelector(SELECTORS.WEB.QNA.INPUT);
  await page.locator(SELECTORS.WEB.QNA.INPUT).fill('문의 테스트');
  await page.waitForSelector('[contenteditable="true"]');
  await page.locator('[contenteditable="true"]').first().fill('문의 테스트 1');
  await page.keyboard.press('Enter');
  await page.locator('[contenteditable="true"]').first().type('문의 테스트 2');
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_QNA_create_write.png` });

  await page.waitForSelector(SELECTORS.WEB.QNA.BUTTON_CLICK_SUBMIT);
  await page.click(SELECTORS.WEB.QNA.BUTTON_CLICK_SUBMIT);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_QNA_create_submit.png` });
}
