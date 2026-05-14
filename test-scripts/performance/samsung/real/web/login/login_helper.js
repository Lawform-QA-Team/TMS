/**
 * 웹 시나리오용: 계정·로그인 진입을 어드민 폴더의 공용 헬퍼에 위임한다.
 * (기존 import 경로 `../login/login_helper` 유지)
 */
export { getWebCredentials as getCredentials, loginWebWithPage as loginWithPage } from '../../admin/login/login_helper.js';
