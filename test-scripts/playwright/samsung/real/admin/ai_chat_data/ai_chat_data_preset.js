/**
 * AI 채팅 데이터 관리 (사전 설정) - Playwright용
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

  await page.goto(URLS.AI_CHAT.CHATDATA);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_preset.png` });
  await wait(2000);

  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT_SEARCH).fill('1');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await page.click(SELECTORS.COMMON.SEARCH);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_preset_search.png` });
  await page.goto(URLS.AI_CHAT.CHATDATA);

  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_REGISTER);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_preset_data_submit.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_CLOSE);

  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_REGISTER);
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT);
  await page.locator(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT).fill('질문 테스트');
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_AI_DRAFT);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_AI_DRAFT);
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA);
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return el && !el.disabled;
    },
    SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA
  );
  await page.locator(SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA).fill('답변 테스트');
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_preset_data_submit_write.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_SAVE);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_SAVE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_preset_data_submit_save.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.TABLE_LIST);
  await page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_preset_table.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_CANCEL);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_CANCEL);
  await wait(2000);
  await page.goto(URLS.AI_CHAT.CHATDATA);

  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.TABLE_LIST);
  await page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT);
  await page.locator(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT).fill('질문 수정 테스트');
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA);
  await page.locator(SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA).fill('답변 수정 테스트');
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_preset_edit.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_SUBMIT);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_SUBMIT);
  await wait(2000);
  await page.goto(URLS.AI_CHAT.CHATDATA);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_preset_edit_submit.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_preset_checkbox.png` });
  await page.goto(URLS.AI_CHAT.CHATDATA);

  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_DELETE);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_DELETE);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_preset_delete.png` });
}
