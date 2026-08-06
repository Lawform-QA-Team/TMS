/**
 * 공지사항 - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

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

  // 공지사항 페이지 이동
  await page.goto(URLS.SERVICE.NOTICE, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_notice.png` });

  // 공지사항 페이지네이션
  // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 공지사항 검색
  await page.waitForSelector(SELECTORS.ADMIN.NOTICE.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.NOTICE.INPUT_SEARCH).fill('공지');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/notice**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_search.png` });
  await page.waitForSelector(SELECTORS.ADMIN.NOTICE.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.NOTICE.INPUT_SEARCH).fill('');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/notice**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);

  // 공지사항 등록 진입
  await page.waitForSelector(SELECTORS.ADMIN.NOTICE.REGISTER);
  await Promise.all([
    page.waitForURL('**/notice**'),
    page.click(SELECTORS.ADMIN.NOTICE.REGISTER),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_register.png` });
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
  await Promise.all([
    page.waitForURL('**/notice**'),
    page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST),
  ]);

  // 공지사항 등록 작성
  await page.waitForSelector(SELECTORS.ADMIN.NOTICE.REGISTER);
  await Promise.all([
    page.waitForURL('**/notice**'),
    page.click(SELECTORS.ADMIN.NOTICE.REGISTER),
  ]);
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.INPUT_TITLE);
  await page.locator(SELECTORS.FEATURES.NOTICE.INPUT_TITLE).fill('공지사항 테스트');
  await page.waitForSelector('[contenteditable="true"]');
  await page.locator('[contenteditable="true"]').first().fill('문의 테스트 1');
  await page.keyboard.press('Enter');
  await page.locator('[contenteditable="true"]').first().type('문의 테스트 2');
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_register_write.png` });

  // 공지사항 등록 저장
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_SUBMIT);
  await Promise.all([
    page.waitForURL('**/notice**'),
    page.click(SELECTORS.FEATURES.NOTICE.BUTTON_SUBMIT),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_register_submit.png` });

  // 공지사항 테이블 클릭
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.TABLE_LIST);
  await Promise.all([
    page.waitForURL('**/notice**'),
    page.click(SELECTORS.COMMON.TABLE),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_table.png` });
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
  await Promise.all([
    page.waitForURL('**/notice**'),
    page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST),
  ]);

  // 공지사항 수정이력
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.TABLE_LIST);
  await Promise.all([
    page.waitForURL('**/notice**'),
    page.click(SELECTORS.COMMON.TABLE),
  ]);
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
  await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history.png` });
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);

  // 공지사항 수정
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.RADIO_VISIBILITY_N);
  await page.click(SELECTORS.FEATURES.NOTICE.RADIO_VISIBILITY_N);
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.INPUT_TITLE);
  await page.locator(SELECTORS.FEATURES.NOTICE.INPUT_TITLE).fill('공지사항 수정');
  await page.waitForSelector('[contenteditable="true"]');
  await page.locator('[contenteditable="true"]').first().type('문의 수정');
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_edit.png` });

  // 공지사항 수정 저장
  await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_SUBMIT);
  await Promise.all([
    page.waitForURL('**/notice**'),
    page.click(SELECTORS.FEATURES.NOTICE.BUTTON_SUBMIT),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_edit_submit.png` });
}
