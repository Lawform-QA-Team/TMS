/**
 * 문서 작성 - 표준 양식 (웹) - Playwright용
 */
import { URLS, WEB_URLS } from '../../url_base_sam.js';
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

  await loginWithPage(page, credentials, WEB_URLS.LOGIN.HOME);

  // 문서 작성 - 표준 양식
  await page.goto(WEB_URLS.AUTODOC.AUTODOC);
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC.png` });

  // 문서 작성 - 표준 양식, 페이지네이션
  // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await wait(2000);
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 문서 작성 - 표준 양식, 검색
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.AUTODOC.INPUT_SEARCH).fill('시연용');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_search.png` });

  // 문서 작성 - 표준 양식, 테이블 클릭
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_table.png` });

  // 문서 작성 - 표준 양식, 작성
    // 내용을 작성했다고 가정
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_write.png` });

  // 문서 작성 - 표준 양식, 임시저장
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DRAFT_SAVE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DRAFT_SAVE);
  await wait(5000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_submit.png` });
  // 임시저장 후 모달 오버레이가 닫힐 때까지 대기
  await page.waitForFunction(() => !document.querySelector('[data-state="open"][aria-hidden="true"]'));
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
}
