/**
 * 필터링 관리 - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 랜덤 문자열 생성 함수
 * @param {number} length - 생성할 문자열 길이
 * @returns {string} 랜덤 문자열
 */
function generateRandomString(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
  const credentials = getCredentials();
  const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

  await loginWithPage(page, credentials);

  // 필터링 관리
  await page.goto(URLS.FILTERING.FILTERING);
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING.png` });

  // 필터링 관리 페이지네이션
  // await page.waitForSelector(SELECTORS.ADMIN.FILTERING.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.FILTERING.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 필터링 관리 검색
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.FILTERING.INPUT_SEARCH).fill('필터');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL('**/filtering**', { waitUntil: 'domcontentloaded' });
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_search.png` });

  // 필터링 관리 필터링 등록 진입
  await page.goto(URLS.FILTERING.FILTERING);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL('**/filtering**', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
  await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register.png` });
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_CLOSE);

  // 필터링 관리 필터링 등록 작성
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
  await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT);
  const randomWord = `필터_${generateRandomString(8)}_${Date.now()}`;
  await page.locator(SELECTORS.ADMIN.FILTERING.INPUT).fill(randomWord);
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_1);
  const randomReason = `테스트사유_${generateRandomString(6)}_${getNewTimeStamp()}`;
  await page.locator(SELECTORS.ADMIN.FILTERING.INPUT_1).fill(randomReason);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_write.png` });

  // 필터링 관리 필터링 등록
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
  await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_submit.png` });

  // 필터링 관리 테이블 클릭
  await page.waitForSelector(SELECTORS.COMMON.TABLE);
  await page.click(`${SELECTORS.COMMON.TABLE} button`);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_table.png` });

  // 필터링 관리 수정
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT);
  const editRandomWord = `수정필터_${generateRandomString(8)}_${Date.now()}`;
  await page.locator(SELECTORS.ADMIN.FILTERING.INPUT).fill(editRandomWord);
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_1);
  const editRandomReason = `수정사유_${generateRandomString(6)}_${getNewTimeStamp()}`;
  await page.locator(SELECTORS.ADMIN.FILTERING.INPUT_1).fill(editRandomReason);
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.SWITCH);
  await page.click(SELECTORS.ADMIN.FILTERING.SWITCH);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_edit.png` });

  // 필터링 관리 수정 저장
  await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
  await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_edit_submit.png` });
}
