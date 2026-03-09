/**
 * 표준 양식 도구 - Playwright용
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

  await page.goto(URLS.AUTODOC.NEW + '1');
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL.png` });
  await wait(2000);

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.INPUT);
  await page.locator(SELECTORS.ADMIN.AUTODOC_TOOL.INPUT).fill('표준 양식 테스트');
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_input.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_TOP_INPUT_SECTION);
  await page.click(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_TOP_INPUT_SECTION);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_add_input_section.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_SECTION);
  await page.click(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_SECTION);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_add_section.png` });

  await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_REMOVE_SECTION);
  await page.click(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_REMOVE_SECTION);
  await wait(2000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_remove_section.png` });
}
