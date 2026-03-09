/**
 * 약관 관리 (개인정보처리방침) - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectRandomDateFromRdpCalendar, selectDateRangeInRdpCalendar } from '../../../../common/datepicker_helper.js';

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

  await page.goto(URLS.SERVICE.PRIVACY);
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY.png` });

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_LAST);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_pagination_last.png` });
  await page.waitForSelector(SELECTORS.ADMIN.TERMS.PAGINATION);
  await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await selectDateRangeInRdpCalendar(page, SELECTORS.ADMIN.TERMS.DATEPICKER, SELECTORS.ADMIN.TERMS.DATEPICKER_START, '2026-02-01', '2026-02-28');
  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_SEARCH);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_search.png` });
  await page.goto(URLS.SERVICE.PRIVACY);

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_register.png` });
  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_LIST);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_LIST);

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
  await selectRandomDateFromRdpCalendar(page, SELECTORS.ADMIN.TERMS.DATEPICKER_REVISION_DATE);
  await page.waitForSelector('[contenteditable="true"]');
  await page.locator('[contenteditable="true"]').first().fill('개인정보처리방침 테스트 1');
  await page.keyboard.press('Enter');
  await page.locator('[contenteditable="true"]').first().type('개인정보처리방침 테스트 2');
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_register_write.png` });

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_register_submit.png` });

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_table.png` });
  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_LIST);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_LIST);

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await page.waitForSelector(SELECTORS.ADMIN.TERMS.RADIO_VISIBILITY_N);
  await page.click(SELECTORS.ADMIN.TERMS.RADIO_VISIBILITY_N);
  await selectRandomDateFromRdpCalendar(page, SELECTORS.ADMIN.TERMS.DATEPICKER_REVISION_DATE);
  await page.waitForSelector('[contenteditable="true"]');
  await page.locator('[contenteditable="true"]').first().fill('수정 테스트');
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_edit.png` });

  await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
  await page.click(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_edit_submit.png` });
}
