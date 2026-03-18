/**
 * 문서 업데이트 리포트 - 타사문서 Playwright용
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

  // 문서 업데이트 리포트 - 타사문서
  await page.goto(URLS.DOCUMENT_UPDATE.OTHER);
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW.png` });

  // 문서 업데이트 리포트 - 타사문서, 날짜 선택
  await selectComboboxOption(page, SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.DATEPICKER);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_date.png` });

  // 문서 업데이트 리포트 - 타사문서, 전체 업데이트 이력
  // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
  // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_update.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);
  // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);

  // 문서 업데이트 리포트 - 타사문서, 전체 업데이트 이력, 페이지네이션
  // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
  // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
  // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.PAGINATION);
  // const last_pages = await page.$$(SELECTORS.COMMON.PAGE_LAST);
  // await last_pages[0].click();
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW_pagination.png` });
  // const first_pages = await page.$$(SELECTORS.COMMON.PAGE_FIRST);
  // await first_pages[0].click();

  // 문서 업데이트 리포트 - 타사문서, 전체 업데이트 이력, 항목 선택
  // await page.waitForLoadState("load");
  // const checks = await page.$$(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.CHECKBOX_1);
  // await checks[1].click();
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_select_history.png` });

  // 문서 업데이트 리포트 - 타사문서, 전체 업데이트 이력, 확인
  // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CONFIRM);
  // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CONFIRM);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_confirm.png` });

  // 문서 업데이트 리포트 - 타사문서, 기업 선택
  await page.waitForLoadState('load');
  const companies = await page.$$('button[data-appearance="outline"][data-size="md"]');
  await companies[Math.floor(Math.random() * companies.length)].click();
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_select_history.png` });

  // 문서 업데이트 리포트 - 타사문서, 원문보기
  await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_VIEW_ORIGINAL);
  await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_VIEW_ORIGINAL);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_original.png` });
  await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);
}
