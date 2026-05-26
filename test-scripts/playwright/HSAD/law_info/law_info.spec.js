import { test, expect } from '@playwright/test';
import { URLS, SELECTORS } from '../util/url_base_hsad.js';
import { login } from '../common/auth.js';

// TC 기대결과 미작성 (LC_001~LC_083 전체)
// 추후 TC 보완 후 구현 예정

test.describe('법령 정보 - 법령 캘린더', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LAW.SCHEDULE);
    });

    test('법령 정보 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/law/);
    });

    test.fixme('LC_001~LC_007: 법령 캘린더 기본 UI (기대결과 미작성)', async () => {});
    test.fixme('LC_008~LC_011: 일정 필터 (기대결과 미작성)', async () => {});
    test.fixme('LC_012~LC_015: 이동 버튼 동작 (기대결과 미작성)', async () => {});
    test.fixme('LC_016~LC_018: 법령 필터1 radio btn (기대결과 미작성)', async () => {});
    test.fixme('LC_019~LC_022: 법령 필터2 checkbox (기대결과 미작성)', async () => {});
    test.fixme('LC_023~LC_040: 일정 노출 (기대결과 미작성)', async () => {});
    test.fixme('LC_041~LC_083: 일정 상세 (기대결과 미작성)', async () => {});
});
