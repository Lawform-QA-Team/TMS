/**
 * 문서 작성 - 표준 양식 (웹) - Playwright용
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

  // 문서 작성 - 표준 양식
  await page.goto(URLS.AUTODOC.STANDARD, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC.png` });

  // 문서 작성 - 표준 양식, 페이지네이션
  // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  // 문서 작성 - 표준 양식, 검색
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.AUTODOC.INPUT_SEARCH).fill('개인정보처리방침_삼성닷컴(최종)');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/autodoc**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_search.png` });

  // 문서 작성 - 표준 양식, 테이블 클릭
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
  await Promise.all([
    page.waitForURL('**/autodoc**'),
    page.click(SELECTORS.COMMON.TABLE),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_table.png` });

  // 문서 작성 - 표준 양식, 작성
  await page.waitForSelector('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
  await page.click('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.INPUT_1);
  await page.locator(SELECTORS.FEATURES.AUTODOC.INPUT_1).fill('문서 작성 테스트');
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_write.png` });

  // 문서 작성 - 표준 양식, 임시저장
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DRAFT_SAVE);
  await Promise.all([
    page.waitForURL('**/autodoc**'),
    page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DRAFT_SAVE),
  ]);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_submit.png` });

  // 문서 작성 - 표준 양식, 미리보기
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_PREVIEW);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_PREVIEW);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_preview.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

  // 문서 작성 - 표준 양식, AI 자동 라벨링
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING);
  // 클릭 후 버튼이 disabled(로딩) 상태가 될 때까지 기다림
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return el && el.disabled;
    },
    SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING
  );
  // 로딩이 끝나 disabled가 해제될 때까지 기다림
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return el && !el.disabled;
    },
    SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING
  );
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_labeling.png` });
  // await page.waitForSelector('//button[contains(text(),"라벨링 되돌리기")]');
  // await page.click('//button[contains(text(),"라벨링 되돌리기")]');

  // 문서 작성 - 표준 양식, 저장
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_submit.png` });

  // 문서 작성 - 기존 문서, 다운로드
  // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD);
  // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_download.png` });

  // 문서 작성 - 기존 문서, 클린본 다운로드
  // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD_1);
  // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD_1);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_clean_download.png` });

  // 문서 작성 - 기존 문서, 수정모드
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit.png` });

  // 문서 작성 - 기존 문서, 수정모드, 저장하기
  await page.waitForSelector('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
  await page.click('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.INPUT_1);
  await page.locator(SELECTORS.FEATURES.AUTODOC.INPUT_1).fill('문서 작성 테스트 1');
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return !el;
    },
    SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE
  );
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_save.png` });

  // 문서 작성 - 기존 문서, 수정모드, 트래킹 끄고 저장하기
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
  await page.waitForSelector('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
  await page.click('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.INPUT_1);
  await page.locator(SELECTORS.FEATURES.AUTODOC.INPUT_1).fill('문서 작성 테스트 2');
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return !el;
    },
    SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE
  );
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_tracking_off.png` });

  // 문서 작성 - 기존 문서, 수정 이력 진입
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

  // 문서 작성 - 기존 문서, 수정 이력, 테이블 클릭
  // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON);
  // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON);
  // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TABLE_LIST);
  // await page.click(SELECTORS.COMMON.TABLE2);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_table.png` });

  // 문서 작성 - 기존 문서, 수정 이력, 비교하기
  // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_COMPARE);
  // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_COMPARE);
  // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TABLE_LIST);
  // await page.click(SELECTORS.COMMON.TABLE);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_compare.png` });

  // 문서 작성 - 기존 문서, 수정 이력, 불러오기 -> 확인, 취소 버튼에 tid가 없어서 진행 불가능
  // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LOAD);
  // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LOAD);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_load.png` });
  // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
  // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

  // 문서 작성 - 기존 문서
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_EDIT);
  await Promise.all([
    page.waitForURL('**/autodoc**'),
    page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_EDIT),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_ai.png` });

  // 문서 작성 - 기존 문서, AI 검토 * 편집, 채팅 입력
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TEXTAREA);
  await page.locator(SELECTORS.FEATURES.AUTODOC.TEXTAREA).fill('조항을 추가해줘');
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SEND);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SEND);
  // 클릭 후 버튼에 스핀이 생길 때까지 기다림
  await page.waitForFunction(
    (selector) => {
      const btn = document.querySelector(selector);
      return btn && btn.querySelector('.animate-spin');
    },
    SELECTORS.FEATURES.AUTODOC.BUTTON_SEND
  );
  // 스핀이 사라질 때까지 기다림
  await page.waitForFunction(
    (selector) => {
      const btn = document.querySelector(selector);
      return btn && !btn.querySelector('.animate-spin');
    },
    SELECTORS.FEATURES.AUTODOC.BUTTON_SEND
  );
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_send.png` });

  // 문서 작성 - 기존 문서, AI 검토 * 편집, 자동 검토
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_AUTO_REVIEW);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_AUTO_REVIEW);
  // 클릭 후 버튼에 스핀이 생길 때까지 기다림
  await page.waitForFunction(
    (selector) => {
      const btn = document.querySelector(selector);
      return btn && btn.querySelector('.animate-spin');
    },
    SELECTORS.FEATURES.AUTODOC.BUTTON_SEND
  );
  // 스핀이 사라질 때까지 기다림
  await page.waitForFunction(
    (selector) => {
      const btn = document.querySelector(selector);
      return btn && !btn.querySelector('.animate-spin');
    },
    SELECTORS.FEATURES.AUTODOC.BUTTON_SEND
  );
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_auto.png` });

  // 문서 작성 - 기존 문서, AI 검토 * 편집, 코멘트
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_comment.png` });
  await page.waitForSelector('button[data-appearance="outline"][data-size="sm"] svg.lucide-log-out');
  await page.click('button[data-appearance="outline"][data-size="sm"] svg.lucide-log-out');
}