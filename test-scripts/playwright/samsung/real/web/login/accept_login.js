/**
 * 최초 로그인 시 개인정보 처리 방침 동의 절차 - Playwright용
 * (동의 관련 셀렉터 구현 시 추가)
 */
import { getCredentials, loginWithPage } from '../../admin/login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
  const credentials = getCredentials();
  await loginWithPage(page, credentials);
  // TODO: 개인정보처리방침 동의 모달/팝업 셀렉터 추가 후 동의 클릭 로직 구현
}
