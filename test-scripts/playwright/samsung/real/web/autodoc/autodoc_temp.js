/**
 * 문서 작성 - 임시 저장 문서 (웹) - Playwright용
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

  // 문서 작성 - 임시 저장 문서
  await page.goto(WEB_URLS.AUTODOC.TEMP);
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp.png` });

  // 문서 작성 - 임시 저장 문서, 페이지네이션
  // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await wait(2000);
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 문서 작성 - 임시 저장 문서, 검색
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.AUTODOC.INPUT_SEARCH).fill('heekun');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_search.png` });

  // 문서 작성 - 임시 저장 문서, 테이블 클릭
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_table.png` });

  // 문서 작성 - 표준 양식, 미리보기
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_PREVIEW);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_PREVIEW);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_preview.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

  // 문서 작성 - 표준 양식, AI 자동 라벨링
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING);
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return el && !el.disabled;
    },
    SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING
  );
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_labeling.png` });

  // 문서 작성 - 표준 양식, 저장
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await wait(1000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_submit.png` });
}
