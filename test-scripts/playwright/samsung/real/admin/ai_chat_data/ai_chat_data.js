/**
 * AI 채팅 데이터 관리 (채팅 로그) - Playwright용
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

  await page.goto(URLS.AI_CHAT.CHATLOG, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data.png` });

  // await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.AI_CHAT_LOG.INPUT_SEARCH).fill('테스트');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/ai-chat-log**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_search.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.AI_CHAT_LOG.INPUT_SEARCH).fill('');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/ai-chat-log**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);

  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.TABLE_LIST);
  await Promise.all([
    page.waitForURL('**/ai-chat-log**'),
    page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_table.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_submit.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_CLOSE);

  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT);
  await page.locator(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT).fill('질문 테스트');
  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_AI_DRAFT);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_AI_DRAFT);
  await page.waitForSelector(`${SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA}:not([disabled])`);
  const textarea = page.locator(SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA);
  const currentValue = await textarea.inputValue();
  await textarea.fill(currentValue + ' 답변 테스트');
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_submit_write.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_SAVE);
  await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_SAVE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_submit_save.png` });
  
  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_LIST);
  await Promise.all([
    page.waitForURL('**/ai-chat-log**'),
    page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_LIST),
  ]);

  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_checkbox.png` });
  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);

  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
  await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_DELETE);
  await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_DELETE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_delete.png` });
}
