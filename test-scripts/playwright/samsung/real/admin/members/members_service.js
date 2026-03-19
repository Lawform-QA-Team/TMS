/**
 * 사용자 관리 (서비스) - Playwright용
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

  await page.goto(URLS.MEMBER.SERVICE, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE.png` });

  // await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH).fill('a');
  await selectComboboxOption(page, SELECTORS.ADMIN.MEMBERS_TABLE.SELECT_ROLE);
  await selectComboboxOption(page, SELECTORS.ADMIN.MEMBERS_TABLE.SELECT_APPROVAL_STATUS);
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/members?tab=service**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_search.png` });

  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.SELECT_ROLE);
  await page.locator(SELECTORS.ADMIN.MEMBERS_TABLE.SELECT_ROLE).click();
  const roleOption = page.locator('[role="option"]').filter({ hasText: '전체' });
  await roleOption.click();
  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.SELECT_APPROVAL_STATUS);
  await page.locator(SELECTORS.ADMIN.MEMBERS_TABLE.SELECT_APPROVAL_STATUS).click();
  const statusOption = page.locator('[role="option"]').filter({ hasText: '전체' });
  await statusOption.click();
  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH);
  await page.locator(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH).fill('임희건');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/members?tab=service**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);
  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.TABLE_LIST);
  await page.click(`${SELECTORS.COMMON.TABLE} button`);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_table.png` });

  await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO);
  await page.locator(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO).nth(2).click();
  await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_1);
  await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_1);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_edit.png` });

  await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.BUTTON_SAVE);
  await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.BUTTON_SAVE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_save.png` });

  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.BUTTON_HANDOVER_CLICK);
  await Promise.all([
    page.waitForURL('**/members?tab=service**'),
    page.click(SELECTORS.ADMIN.MEMBERS_TABLE.BUTTON_HANDOVER_CLICK),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover.png` });
  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_GO_TO_LIST);
  await Promise.all([
    page.waitForURL('**/members?tab=service**'),
    page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_GO_TO_LIST),
  ]);

  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.BUTTON_HANDOVER_CLICK);
  await Promise.all([
    page.waitForURL('**/members?tab=service**'),
    page.click(SELECTORS.ADMIN.MEMBERS_TABLE.BUTTON_HANDOVER_CLICK),
  ]);
  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEROR);
  await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEROR);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferor.png` });
  await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CLOSE);

  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEROR);
  await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEROR);
  // await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferor_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.INPUT);
  await page.locator(SELECTORS.ADMIN.USER_SELECT_MODAL.INPUT).fill('hkqa');
  await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_SEARCH);
  await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_SEARCH);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferor_search.png` });

  await page.waitForSelector(SELECTORS.COMMON.TABLE);
  await page.click(SELECTORS.COMMON.TABLE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferor_table.png` });

  await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CONFIRM);
  await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CONFIRM);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferor_submit.png` });

  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEREE);
  await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEREE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferee.png` });
  await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CLOSE);
  await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CLOSE);

  await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEREE);
  await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEREE);
  // await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_LAST);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferee_pagination_last.png` });
  // await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.PAGINATION);
  // await page.click(SELECTORS.COMMON.PAGE_FIRST);

  await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.INPUT);
  await page.locator(SELECTORS.ADMIN.USER_SELECT_MODAL.INPUT).fill('q1m');
  await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_SEARCH);
  await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_SEARCH);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferee_search.png` });

  await page.waitForSelector(SELECTORS.COMMON.TABLE);
  await page.click(SELECTORS.COMMON.TABLE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferee_table.png` });

  await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CONFIRM);
  await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CONFIRM);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferee_submit.png` });

  // await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_SAVE);
  // await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_SAVE);
  // await page.waitForLoadState('domcontentloaded');
  // timestamp = getNewTimeStamp();
  // await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_submit.png` });
}
