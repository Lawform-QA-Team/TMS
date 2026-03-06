/**
 * 약관 관리 (이용약관) - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectDateRangeInRdpCalendar } from '../../../../common/datepicker_helper.js';

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

  await page.goto(URLS.SERVICE.TERMS);
  let timestamp = getNewTimeStamp();
  await wait(5000);
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_TERMS.png` });

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_LAST);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_TERMS_pagination_last.png` });
  await page.waitForSelector(SELECTORS.ADMIN.TERMS.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await selectDateRangeInRdpCalendar(page, SELECTORS.ADMIN.TERMS.DATEPICKER, SELECTORS.ADMIN.TERMS.DATEPICKER_START, '2026-02-01', '2026-02-28');
  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_SEARCH);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_SEARCH);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_TERMS_search.png` });
  await page.goto(URLS.SERVICE.TERMS);

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_TERMS_register.png` });
  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_LIST);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_LIST);

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
  await page.waitForSelector('[contenteditable="true"]');
  await page.locator('[contenteditable="true"]').first().fill('이용약관 테스트 1');
  await page.keyboard.press('Enter');
  await page.locator('[contenteditable="true"]').first().type('이용약관 테스트 2');
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_TERMS_register_write.png` });

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_TERMS_register_submit.png` });

  await page.waitForSelector(SELECTORS.COMMON.TABLE);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_TERMS_table.png` });
  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_LIST);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_LIST);

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await page.waitForSelector(SELECTORS.ADMIN.TERMS.RADIO_VISIBILITY_N);
  await page.click(SELECTORS.ADMIN.TERMS.RADIO_VISIBILITY_N);
  await page.waitForSelector('[contenteditable="true"]');
  await page.locator('[contenteditable="true"]').first().fill('수정 테스트');
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_TERMS_edit.png` });

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_TERMS_edit_submit.png` });
}
