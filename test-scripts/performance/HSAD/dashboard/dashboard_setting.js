import { browser } from 'k6/browser';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS, SELECTORS } from '../util/url_base_hsad.js';
import { hsadBrowserOptions, loginToDashboard, measure } from '../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const dashboardSettingsLoad = new Trend('hsad_dashboard_settings_load');

export default async function () {
    const page = await browser.newPage();
    try {
        // 로그인 및 대시보드 진입
        await loginToDashboard(page, URLS, SELECTORS);

        await measure(dashboardSettingsLoad, () => page.goto(URLS.LOGIN.DASHBOARD));

        // LC_002: 대시보드 설정 모달 호출 (이미지 alt="setting")
        const settingBtn = page.locator(SELECTORS.DASHBOARD.SETTING);
        await settingBtn.click();
        
        // LC_003: '전자서명 대기' 체크박스 노출 및 비활성(Unchecked) 상태 확인
        const eSignCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: '전자서명 대기' });
        const hasSettingsClose = await page.locator(SELECTORS.DASHBOARD.CLOSE).isVisible();
        const isESignUnchecked = !(await eSignCheckbox.isChecked());

        check(page, {
            'LC_002: 설정 모달 노출 확인': () => hasSettingsClose,
            'LC_003: 전자서명 대기 체크박스 초기 상태(OFF) 확인': () => isESignUnchecked,
        });

        // LC_005: 체크박스 활성화 후 저장
        await eSignCheckbox.check();
        await page.locator('button:has-text("저장")').click();
        
        // 저장 후 대시보드 반영 대기
        sleep(2);
        const hasESignTile = await page.locator('text="전자서명 대기"').isVisible();

        check(page, {
            'LC_005: 전자서명 타일 대시보드 추가 확인': () => hasESignTile,
        });

    } finally {
        await page.close();
    }
}
