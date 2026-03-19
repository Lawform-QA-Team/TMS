/**
 * 문서 작성 - 기존 문서 (웹) - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getWebCredentials, loginWithPage } from '../../admin/login/login_helper.js';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
  const credentials = getWebCredentials();
  const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

  await loginWithPage(page, credentials, URLS.WEB_LOGIN.HOME);

  // 문서 작성 - 기존 문서
  await page.goto(URLS.AUTODOC.EXISTING, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing.png` });

  // 문서 작성 - 기존 문서, 페이지네이션
  // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 문서 작성 - 기존 문서, 검색
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.AUTODOC.INPUT_SEARCH).fill('heekun');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/autodoc?method=existing**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_search.png` });

  // 문서 작성 - 기존 문서, 테이블 클릭
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
  await Promise.all([
    page.waitForURL('**/autodoc?method=existing**'),
    page.click(SELECTORS.COMMON.TABLE),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_table.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
  await Promise.all([
    page.waitForURL('**/autodoc'),
    page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST),
  ]);
}
