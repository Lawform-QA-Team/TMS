/**
 * 문서 업데이트 리포트 - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectRandomDateFromRdpCalendar } from '../../../../common/datepicker_helper.js';

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

  await page.goto(URLS.DOCUMENT_UPDATE.LAW);
  await wait(5000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW.png` });

  await selectRandomDateFromRdpCalendar(page, SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.DATEPICKER);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW_1.png` });

  await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
  await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW_2.png` });
  await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);

  await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
  await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
  await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CONFIRM);
  await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CONFIRM);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW_3.png` });

  await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_VIEW_ORIGINAL);
  await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_VIEW_ORIGINAL);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW_4.png` });
}
