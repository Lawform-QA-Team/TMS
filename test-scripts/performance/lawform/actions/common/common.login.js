/**
 * [Action] 공통 — 로그인
 * login_to_dashboard() 래퍼
 */
import login_to_dashboard from '@tms/performance/common/login/login_to_dashboard.js';

/**
 * 로그인 후 page 반환
 * @returns {Promise<import('k6/browser').Page>}
 */
export async function login() {
    return await login_to_dashboard();
}
