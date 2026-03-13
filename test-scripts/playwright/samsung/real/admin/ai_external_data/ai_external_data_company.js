/**
 * AI 외부 데이터 관리 (타사 문서) - Playwright용
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

  // AI 외부 데이터 관리 - 타사 문서 진입
  await page.goto(URLS.AI_DATA.COMPANY);
  await page.waitForLoadState('networkidle');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company.png` });

  // AI 외부 데이터 관리 - 타사 문서 페이지네이션
  // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await wait(2000);
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // AI 외부 데이터 관리 - 타사 문서 검색
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH).fill('타사');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await page.waitForLoadState('networkidle');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_search.png` });
  await page.goto(URLS.AI_DATA.COMPANY);
  await page.waitForLoadState('networkidle');

  // AI 외부 데이터 관리 - 타사 문서 등록 진입
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
  await page.waitForLoadState('networkidle');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_GO_BACK);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_GO_BACK);
  await page.goto(URLS.AI_DATA.COMPANY);
  await page.waitForLoadState('networkidle');

  // AI 외부 데이터 관리 - 타사 문서 등록 작성
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_CATEGORY);
  await page.locator(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_CATEGORY).fill('타사 문서 등록 테스트');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_URL);
  await page.locator(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_URL).fill('https://www.google.com');
  await page.waitForLoadState('networkidle');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register_write.png` });

  // AI 외부 데이터 관리 - 텍스트 추출
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_EXTRACT_TEXT);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_EXTRACT_TEXT);
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return el && !el.disabled;
    },
    SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_EXTRACT_TEXT
  );
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register_extract.png` });
  await page.keyboard.press('Escape');

  // AI 외부 데이터 관리 - 미리보기
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_PREVIEW);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_PREVIEW);
  await page.waitForLoadState('networkidle');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register_preview.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_CLOSE);

  // AI 외부 데이터 관리 - 타사 문서 등록
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_SUBMIT);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_SUBMIT);
  await page.waitForLoadState('networkidle');
  await page.goto(URLS.AI_DATA.COMPANY);
  await page.waitForLoadState('networkidle');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register_submit.png` });

  // AI 외부 데이터 관리 - 타사 문서 테이블 클릭
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.TABLE_LIST);
  await page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
  await page.waitForLoadState('networkidle');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_table_click.png` });

  // AI 외부 데이터 관리 - 타사 문서 상세
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
  // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_VIEW);
  // const views = await page.$$(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_VIEW);
  // if (views.length >= 2) {
  //     await views[Math.floor(Math.random() * (views.length - 1)) + 1].click();
  // }
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_table_detail.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);
  await page.goto(URLS.AI_DATA.COMPANY);
  await page.waitForLoadState('networkidle');

  // AI 외부 데이터 관리 - 타사 문서 체크 박스
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
  await page.waitForLoadState('networkidle');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_checkbox.png` });
  await page.goto(URLS.AI_DATA.COMPANY);

  // AI 외부 데이터 관리 - 타사 문서 선택 문서 삭제
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
  await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
  await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
  await page.waitForLoadState('networkidle');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_delete.png` });
}
