/**
 * 문서 작성 - 기존 문서 (웹) - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
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

  await loginWithPage(page, credentials);

  // 문서 작성 - 기존 문서
  await page.goto(URLS.AUTODOC.EXISTING);
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing.png` });

  // 문서 작성 - 기존 문서, 페이지네이션
  // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await wait(2000);
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 문서 작성 - 기존 문서, 검색
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.AUTODOC.INPUT_SEARCH).fill('_시연용');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_search.png` });

  // 문서 작성 - 기존 문서, 테이블 클릭
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_table.png` });

  // 문서 작성 - 기존 문서, 다운로드
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_download.png` });

  // 문서 작성 - 기존 문서, 클린본 다운로드
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD_1);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD_1);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_clean_download.png` });

  // 문서 작성 - 기존 문서, 수정모드
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit.png` });

  // 문서 작성 - 기존 문서, 수정모드, 저장하기
    // 내용을 작성했다고 가정
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await wait(1000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_save.png` });

  // 문서 작성 - 기존 문서, 수정모드, 트래킹 끄고 저장하기
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
    // 내용을 작성했다고 가정
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await wait(1000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_tracking_off.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);

  // 문서 작성 - 기존 문서, 수정 이력 진입
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

  // 문서 작성 - 기존 문서, 수정 이력, 테이블 클릭
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE2);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_table.png` });

  // 문서 작성 - 기존 문서, 수정 이력, 비교하기
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_COMPARE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_COMPARE);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_compare.png` });

  // 문서 작성 - 기존 문서, 수정 이력, 불러오기 -> 확인, 취소 버튼에 tid가 없어서 진행 불가능
  // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LOAD);
  // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LOAD);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
}
