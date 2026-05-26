import { test, expect } from '@playwright/test';
import { URLS, SELECTORS } from '../util/url_base_hsad.js';
import { login } from '../common/auth.js';

// TC 기대결과 미작성 (LC_001~LC_059 전체)
// 추후 TC 보완 후 구현 예정

test.describe('대시보드', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LOGIN.DASHBOARD);
    });

    test('대시보드 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test.describe('대시보드 설정', () => {
        test.fixme('LC_001~LC_006: 대시보드 설정 (기대결과 미작성)', async () => {});
    });

    test.describe('전자서명 대기 타일', () => {
        test.fixme('LC_007~LC_024: 전자서명 대기 타일 (기대결과 미작성)', async () => {});
        test.fixme('LC_전자서명_공통: 전자서명 대기 타일 공통 (기대결과 미작성)', async () => {});
    });

    test.describe('법무팀 전자서명 대기 타일', () => {
        test.fixme('LC_법무팀: 법무팀 전자서명 대기 타일 (기대결과 미작성)', async () => {});
    });
});

test.describe('전체 통계', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.STATISTICS.STATISTICS);
    });

    test('전체 통계 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/statistics/);
    });

    test.fixme('LC_전체통계: 전체 통계 (기대결과 미작성)', async () => {});
    test.fixme('LC_계약체결추이: 계약 체결 추이 (기대결과 미작성)', async () => {});
    test.fixme('LC_개인부서현황: 개인/부서 현황 (기대결과 미작성)', async () => {});
    test.fixme('LC_다가오는일정: 다가오는 일정 (기대결과 미작성)', async () => {});
    test.fixme('LC_유형별건수: 유형별 건수 (기대결과 미작성)', async () => {});
});
