import { test, expect } from '@playwright/test';
import { SELECTORS } from '../util/url_base_hsad.js';
import { login } from '../common/auth.js';

test.describe('HSAD Dashboard - LC Cases', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    async function openDashboardSettings(page) {
        await page.click(SELECTORS.DASHBOARD.SETTING);
        await expect(page.locator(SELECTORS.DASHBOARD.CLOSE)).toBeVisible();
    }

    function eSignSettingCheckbox(page) {
        return page
            .locator('label, div, li')
            .filter({ hasText: /^전자서명 대기$/ })
            .locator('input[type="checkbox"]')
            .first();
    }

    async function saveDashboardSettings(page) {
        await page.click('button:has-text("저장")');
        await expect(page.locator(SELECTORS.DASHBOARD.CLOSE)).toBeHidden();
    }

    test('LC_001~LC_007: Dashboard Settings and Tile Visibility', async ({ page }) => {
        // LC_001: 전자서명 타일 기본 미노출 상태 확인을 위해 설정을 OFF로 초기화
        await openDashboardSettings(page);
        let eSignCheckbox = eSignSettingCheckbox(page);
        await expect(eSignCheckbox).toBeVisible();
        if (await eSignCheckbox.isChecked()) {
            await eSignCheckbox.uncheck();
            await saveDashboardSettings(page);
        } else {
            await page.click(SELECTORS.DASHBOARD.CLOSE);
        }
        await expect(page.getByText('전자서명 대기')).toBeHidden();

        // LC_002: 설정 모달 호출 및 전자서명 대기 항목 노출
        await openDashboardSettings(page);

        // LC_003: '전자서명 대기' 체크박스 확인
        eSignCheckbox = eSignSettingCheckbox(page);
        await expect(eSignCheckbox).toBeVisible();
        await expect(eSignCheckbox).not.toBeChecked();

        // LC_004: 취소 시 모달이 닫히며 대시보드 변경사항 없음
        await eSignCheckbox.check();
        await page.click('button:has-text("취소")');
        await expect(page.locator(SELECTORS.DASHBOARD.CLOSE)).toBeHidden();
        await expect(page.getByText('전자서명 대기')).toBeHidden();

        await openDashboardSettings(page);
        eSignCheckbox = eSignSettingCheckbox(page);
        await expect(eSignCheckbox).not.toBeChecked();

        // LC_005: 활성화 및 저장
        await eSignCheckbox.check();
        await saveDashboardSettings(page);

        // LC_006: 추가된 타일의 편집 핸들이 노출되는지 확인
        const eSignTile = page.getByText('전자서명 대기').first();
        await expect(eSignTile).toBeVisible();
        await eSignTile.hover();
        await expect(page.locator('[class*="resize"], [aria-label*="크기"], [title*="크기"]').first()).toBeVisible();

        // LC_007: 타일 노출 확인
        await expect(eSignTile).toBeVisible();
    });
});
