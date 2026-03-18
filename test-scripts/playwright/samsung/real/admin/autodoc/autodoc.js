/**
 * 표준 양식 관리 - Playwright용
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

  // 표준 양식 관리 진입
  await page.goto(URLS.AUTODOC.AUTODOC);
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC.png` });

  // 표준 양식 테이블 페이지네이션
  // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 표준 양식 검색
  await page.waitForSelector('button[data-slot="popover-trigger"]');
  await page.click('button[data-slot="popover-trigger"]');
  await page.waitForSelector('input[data-slot="input"][placeholder="카테고리 검색"]');
  await page.fill('input[data-slot="input"][placeholder="카테고리 검색"]', '카테고리');
  await page.waitForLoadState('load');
  const contents = await page.$$('button.relative.flex.w-full.cursor-pointer.items-center.rounded-sm.text-left');
  await contents[Math.floor(Math.random() * contents.length)].click();
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH).fill('시연용');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_search.png` });
  await page.goto(URLS.AUTODOC.AUTODOC);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL('**/autodoc**', { waitUntil: 'domcontentloaded' });

  // 표준 양식 등록 진입
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_register.png` });

  // 표준 양식 등록 - 양식 유형 선택
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.SELECT_SELECTED_CATEGORY);
  await selectComboboxOption(page, SELECTORS.ADMIN.AUTODOC.SELECT_SELECTED_CATEGORY);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_register.select.png` });
  await page.goto(URLS.AUTODOC.AUTODOC);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL('**/autodoc**', { waitUntil: 'domcontentloaded' });

  // 표준 양식 테이블 클릭
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_table.png` });
  await page.goto(URLS.AUTODOC.AUTODOC);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL('**/autodoc**', { waitUntil: 'domcontentloaded' });

  // 업데이트 추천
  // await page.waitForSelector('div[data-state="open"].fixed.inset-0', { 
  //   state: 'hidden'
  // });
  await page.locator('button').filter({ hasText: '업데이트 추천' }).waitFor();
  await page.locator('button').filter({ hasText: '업데이트 추천' }).click();
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_update.png` });
  await page.goto(URLS.AUTODOC.AUTODOC);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL('**/autodoc**', { waitUntil: 'domcontentloaded' });

  // 표준 양식 테이블 업데이트 클릭
  // await page.waitForSelector(`span[data-slot="badge"]`);
  // const badges = await page.$$(`span[data-slot="badge"]`);
  // await badges[0].click();
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_table_update.png` });
  // await page.goto(URLS.AUTODOC.AUTODOC);

  // 카테고리 관리
  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CATEGORY_MANAGEMENT);
  await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CATEGORY_MANAGEMENT);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category.png` });
}
