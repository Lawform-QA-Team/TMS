/**
 * 로그인 to Web - Playwright용
 */
import { getCredentials, loginWithPage } from './login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
  const credentials = getCredentials();
  await loginWithPage(page, credentials);
}
