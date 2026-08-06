import { getCredentials, loginWithPage } from '../login/login_helper.js';

export async function login(page) {
    const credentials = getCredentials();
    await loginWithPage(page, credentials);
}
