/**
 * 표준 양식 카테고리 관리 - Playwright용
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
  const randomStr = () => Math.random().toString(36).slice(2, 7);

  await loginWithPage(page, credentials);

  // 표준 양식 관리 진입
  await page.goto(URLS.AUTODOC.CATEGORY);
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category.png` });

  // 카테고리 관리 페이지네이션
  // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await wait(2000);
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 카테고리 검색
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH).fill('카테고리');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_search.png` });
  await page.goto(URLS.AUTODOC.CATEGORY);

  // 카테고리 등록 진입
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);

  // 카테고리 등록 작성
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT);
  await page.locator(SELECTORS.ADMIN.AUTODOC.INPUT).fill(`cat_${randomStr()}`);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register_write.png` });

  // 카테고리 등록 저장
  await page.waitForSelector(`${SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE}:not([disabled])`);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register_save.png` });

  // 카테고리 테이블 클릭
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_table.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);

  // 카테고리 수정
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT);
  await page.locator(SELECTORS.ADMIN.AUTODOC.INPUT).fill(`edit_${randomStr()}`);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_edit_category.png` });

  // 카테고리 수정 저장
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_edit_category_save.png` });
}
