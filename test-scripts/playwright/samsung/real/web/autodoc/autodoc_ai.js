/**
 * 문서 작성 - 기존 문서, AI 검토 (웹) - Playwright용
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

  // AI 검토 편집
  await page.goto(URLS.AUTODOC.EXISTING);
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.AUTODOC.INPUT_SEARCH).fill('삼성');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
  await page.click(SELECTORS.COMMON.TABLE);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_EDIT);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_EDIT);
  await wait(2000);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_ai.png` });

  // 문서 작성 - 기존 문서, AI 검토 * 편집, 채팅 입력
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TEXTAREA);
  await page.locator(SELECTORS.FEATURES.AUTODOC.TEXTAREA).fill('조항을 추가해줘');
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SEND);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SEND);
  await wait(15000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_send.png` });

  // 문서 작성 - 기존 문서, AI 검토 * 편집, 자동 검토
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_AUTO_REVIEW);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_AUTO_REVIEW);
  await wait(15000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_auto.png` });

  // 문서 작성 - 기존 문서, AI 검토 * 편집, 코멘트
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_comment.png` });
  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
}
