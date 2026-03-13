/**
 * 문서 조회 (웹) - Playwright용
 */
import { URLS, WEB_URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getWebCredentials, loginWithPage } from '../../admin/login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { selectDateRangeInRdpCalendar } from '../../../../common/datepicker_helper.js';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
  const credentials = getWebCredentials();
  const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

  await loginWithPage(page, credentials, WEB_URLS.LOGIN.HOME);

  // 문서 조회
  await page.goto(WEB_URLS.DRIVE.DRIVE);
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DRIVE.png` });

  // 문서 조회, 페이지네이션
  // await page.waitForSelector(SELECTORS.WEB.DRIVE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await wait(2000);
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.WEB.DRIVE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 문서 조회, 카테고리 검색
  await selectComboboxOption(page, SELECTORS.WEB.DRIVE.SELECT_CATEGORY);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_category.png` });

  // 문서 조회, 등록일 검색
  await selectDateRangeInRdpCalendar(page, SELECTORS.WEB.DRIVE.DATEPICKER, SELECTORS.WEB.DRIVE.DATEPICKER_START, '2026-02-01', '2026-02-28');
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_datepicker.png` });

  // 문서 조회, 검색
  await page.waitForSelector(SELECTORS.WEB.DRIVE.INPUT);
  await page.locator(SELECTORS.WEB.DRIVE.INPUT).fill('heekun');
  await page.waitForSelector(SELECTORS.WEB.DRIVE.BUTTON_SEARCH);
  await page.click(SELECTORS.WEB.DRIVE.BUTTON_SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_search.png` });
  await page.goto(WEB_URLS.DRIVE.DRIVE);

  // 문서 조회, 테이블 클릭
  await page.waitForSelector(SELECTORS.WEB.DRIVE.TABLE_LIST);
  await page.click(`${SELECTORS.COMMON.TABLE} span.cursor-pointer`);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_table.png` });
}
