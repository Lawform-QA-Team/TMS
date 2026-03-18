/**
 * 문서 업데이트 리포트 - Playwright용
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

  // 문서 업데이트 리포트
  await page.goto(URLS.DOCUMENT_UPDATE.LAW);
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW.png` });

  // 문서 업데이트 리포트, 날짜 선택
  await selectComboboxOption(page, SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.DATEPICKER);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW_1.png` });

  // 문서 업데이트 리포트, 전체 업데이트 이력
  // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
  // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW_update.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);
  // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);

  // 문서 업데이트 리포트, 전체 업데이트 이력, 페이지네이션
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

  // 문서 업데이트 리포트, 전체 업데이트 이력, 항목 선택
  // await page.waitForLoadState("load");
  // const checks = await page.$$(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.CHECKBOX_1);
  // await checks[1].click();
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW_select_history.png` });

  // 문서 업데이트 리포트, 전체 업데이트 이력, 확인
  // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CONFIRM);
  // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CONFIRM);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_confirm.png` });

  // 문서 업데이트 리포트, 법령 선택
  await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON);
  const laws = await page.$$(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON);
  await laws[Math.floor(Math.random() * laws.length)].click();
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW_select_history.png` });

  // 문서 업데이트 리포트, 원문보기
  await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_VIEW_ORIGINAL);
  await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_VIEW_ORIGINAL);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_original.png` });
  await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);
}
