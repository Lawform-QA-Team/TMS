/**
 * 공통 로그인 액션
 */
import { getCredentials, loginWithPage } from '../../web/login/login_helper.js';

export async function login(page) {
    const credentials = getCredentials();
    await loginWithPage(page, credentials);
}
