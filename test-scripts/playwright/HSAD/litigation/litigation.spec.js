import { test, expect } from '@playwright/test';
import { URLS, SELECTORS } from '../util/url_base_hsad.js';
import { login } from '../common/auth.js';

// 대부분의 TC 기대결과 미작성 (865건 중 1건만 기대결과 있음)
// 추후 TC 보완 후 구현 예정

test.describe('송무 - 메뉴 트리', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.fixme('LC_001: 송무 카테고리 추가 (기대결과 미작성)', async () => {});
    test.fixme('LC_002: 송무 하위 카테고리 추가 (기대결과 미작성)', async () => {});
    test.fixme('LC_003: 기본 기능 (기대결과 미작성)', async () => {});
});

test.describe('송무 - 리스트', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LITIGATION.REVIEW);
    });

    test('송무 리스트 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/litigation/);
    });

    test.fixme('LC_리스트: 송무 리스트 (기대결과 미작성)', async () => {});
});

test.describe('송무 - 임시저장 리스트', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LITIGATION.DRAFT);
    });

    test('임시저장 리스트 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/litigation\/draft/);
    });

    test.fixme('LC_임시저장: 임시저장 리스트 (기대결과 미작성)', async () => {});
});

test.describe('송무 - 등록 화면', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LITIGATION.DRAFT);
    });

    test.fixme('LC_등록화면: 송무 등록 화면 (기대결과 미작성)', async () => {});
});

test.describe('송무 - 상세 (공통)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.fixme('LC_상세_공통: 송무 상세 공통 (기대결과 미작성)', async () => {});
    test.fixme('LC_상세_등록자: 송무 상세 (송무 등록자) (기대결과 미작성)', async () => {});
    test.fixme('LC_상세_법무담당: 송무 상세 (법무 담당자) (기대결과 미작성)', async () => {});
    test.fixme('LC_상세_법무배정: 송무 상세 (법무 배정 담당자) (기대결과 미작성)', async () => {});
});

test.describe('송무 - 전체 일정', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LITIGATION.SCHEDULE);
    });

    test('송무 전체 일정 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/litigation\/schedule/);
    });

    test.fixme('LC_일정_공통: 송무 전체 일정 공통 (기대결과 미작성)', async () => {});
    test.fixme('LC_일정_법무배정: 송무 전체 일정 (법무 배정 담당자) (기대결과 미작성)', async () => {});
});

test.describe('송무 - 대시보드 타일', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LOGIN.DASHBOARD);
    });

    test.fixme('LC_대시보드타일: 송무 대시보드 타일 (기대결과 미작성)', async () => {});
});
