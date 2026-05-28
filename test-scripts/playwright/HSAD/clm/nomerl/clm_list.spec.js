import { test, expect } from '@playwright/test';
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { login } from '../../common/auth.js';

// ─── 각종 조회 (LC_358~LC_367) ───────────────────────────────────────────────

test.describe('CLM 계약 검토 - 각종 조회', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('LC_358: 검토요청 조회 페이지 이동', async ({ page }) => {
        await page.goto(URLS.CLM.REVIEW);
        await expect(page).toHaveURL(/\/clm\/review/);
    });

    test('LC_359: 나의 검토 요청 조회', async ({ page }) => {
        await page.goto(URLS.CLM.REVIEW);
        // TODO: 나의 검토 요청 필터 탭 selector 확인 필요
        await expect(page).toHaveURL(/\/clm\/review/);
    });

    test('LC_360: 소속팀 검토 요청 조회', async ({ page }) => {
        await page.goto(URLS.CLM.REVIEW);
        // TODO: 소속팀 필터 탭 selector 확인 필요
        await expect(page).toHaveURL(/\/clm\/review/);
    });

    test('LC_361: 전체 검토 요청 조회', async ({ page }) => {
        await page.goto(URLS.CLM.REVIEW);
        // TODO: 전체 필터 탭 selector 확인 필요
        await expect(page).toHaveURL(/\/clm\/review/);
    });

    test('LC_362: 체결 계약서 조회 페이지 이동', async ({ page }) => {
        await page.goto(URLS.CLM.COMPLETE);
        await expect(page).toHaveURL(/\/clm\/complete/);
    });

    test('LC_363: 나의 체결 계약서 조회', async ({ page }) => {
        await page.goto(URLS.CLM.COMPLETE);
        await expect(page).toHaveURL(/\/clm\/complete/);
    });

    test('LC_364: 소속팀 체결 계약서 조회', async ({ page }) => {
        await page.goto(URLS.CLM.COMPLETE);
        await expect(page).toHaveURL(/\/clm\/complete/);
    });

    test('LC_365: 전체 체결 계약서 조회', async ({ page }) => {
        await page.goto(URLS.CLM.COMPLETE);
        await expect(page).toHaveURL(/\/clm\/complete/);
    });

    test('LC_366: 체결 계약서 별도 등록', async ({ page }) => {
        await page.goto(URLS.CLM.COMPLETE);
        await expect(page).toHaveURL(/\/clm\/complete/);
    });

    test('LC_367: AI 계약 내용 비교 페이지 이동', async ({ page }) => {
        await page.goto(URLS.CLM.COMPARE);
        await expect(page).toHaveURL(/\/document_compare/);
        await expect(page.locator(SELECTORS.BUSINESS.DOCUMENT_COMPARE.COMPARE_BUTTON)).toBeVisible();
    });
});

// ─── 일시중단 중 요청 조회 (LC_368~) ──────────────────────────────────────────

test.describe('CLM 계약 검토 - 일시중단 중 요청 조회', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.PAUSE);
    });

    test('LC_368: 일시중단 중 요청 조회 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/clm\/complete.*is_paused/);
    });

    test('LC_368~: 일시중단 목록 페이지 기본 UI 확인', async ({ page }) => {
        // TODO: 기대결과 미작성 TC (LC_369~LC_541) - 추후 보완 필요
        await expect(page).toHaveURL(/\/clm\/complete.*is_paused/);
    });

    // TODO: LC_369~LC_541 기대결과 미작성 - 추후 TC 보완 후 구현 예정
    test.fixme('LC_369~LC_541: 일시중단 상세 동작 TC (기대결과 미작성)');
});
