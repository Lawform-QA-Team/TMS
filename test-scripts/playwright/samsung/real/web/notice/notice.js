/**
 * 공지사항 (웹) - Playwright용
 */
import { URLS, WEB_URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../../admin/login/login_helper.js';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
  const credentials = getCredentials();
  const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

  await loginWithPage(page, credentials, WEB_URLS.LOGIN.HOME);

  // 공지사항
  await page.goto(WEB_URLS.SERVICE.NOTICE);
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE.png` });

  // 공지사항, 페이지네이션
  // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await wait(2000);
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 공지사항, 검색
  await page.waitForSelector(SELECTORS.WEB.NOTICE.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.NOTICE.INPUT_SEARCH).fill('공지');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_search.png` });

  // 공지사항, 테이블 클릭
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_table.png` });

  // 공지사항, 수정 이력
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
  await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history.png` });

  // 공지사항, 수정 이력 페이지네이션
  // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await wait(2000);
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history_pagination_last.png` });

  // 공지사항, 수정 이력 닫기
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history_close.png` });

  // 공지사항, 목록
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
  await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_list.png` });
}
