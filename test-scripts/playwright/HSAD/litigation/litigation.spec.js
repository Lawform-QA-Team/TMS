import { test, expect } from '@playwright/test';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../util/selector_hsad.js';
import { login } from '../common/auth.js';

// TC 기대결과 미작성 전체 (865건)
// 추후 TC 보완 후 구현 예정

// ─── 메뉴 트리 ────────────────────────────────────────────────────────────────

test.describe('송무 - 메뉴 트리', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.fixme('LC_001: 송무 카테고리 추가 (기대결과 미작성)', async () => {});
    test.fixme('LC_002: 송무 하위 카테고리 추가 (기대결과 미작성)', async () => {});
    test.fixme('LC_003: 기본 기능 (기대결과 미작성)', async () => {});
});

// ─── 대시보드 타일 ────────────────────────────────────────────────────────────

test.describe('송무 - 대시보드 타일', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LOGIN.DASHBOARD);
    });

    test.describe('대시보드 설정', () => {
        test.fixme('대시보드 설정 (기대결과 미작성)', async () => {});
    });

    test.describe('담당자별 사건 현황', () => {
        test.fixme('담당자별 사건 현황 (기대결과 미작성)', async () => {});
    });

    test.describe('법무 담당자 배정 요청', () => {
        test.fixme('법무 담당자 배정 요청 (기대결과 미작성)', async () => {});
    });

    test.describe('사건 진행 중 리스트', () => {
        test.fixme('사건 진행 중 리스트 (기대결과 미작성)', async () => {});
    });

    test.describe('송무 일정', () => {
        test.fixme('송무 일정 (기대결과 미작성)', async () => {});
    });
});

// ─── 임시저장 리스트 ──────────────────────────────────────────────────────────

test.describe('송무 - 임시저장 리스트', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LITIGATION.DRAFT);
    });

    test('임시저장 리스트 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/litigation\/draft/);
    });

    test.describe('사건 리스트', () => {
        test.fixme('사건 리스트 UI 및 동작 (기대결과 미작성)', async () => {});
    });

    test.describe('btn 동작', () => {
        test.fixme('임시저장 리스트 btn 동작 (기대결과 미작성)', async () => {});
    });

    test.describe('신규 송무 등록', () => {
        test.fixme('신규 송무 등록 진입 (기대결과 미작성)', async () => {});
    });
});

// ─── 송무 등록 화면 ───────────────────────────────────────────────────────────

test.describe('송무 - 등록 화면', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LITIGATION.DRAFT);
    });

    test.describe('기본정보', () => {
        test.fixme('등록 화면 기본정보 (기대결과 미작성)', async () => {});
    });

    test.describe('상세정보', () => {
        test.fixme('등록 화면 상세정보 (기대결과 미작성)', async () => {});
    });

    test.describe('btn 동작', () => {
        test.fixme('등록 화면 btn 동작 (기대결과 미작성)', async () => {});
    });
});

// ─── 송무 리스트 ──────────────────────────────────────────────────────────────

test.describe('송무 - 리스트', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LITIGATION.REVIEW);
    });

    test('송무 리스트 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/litigation/);
    });

    test.describe('필터 및 부가 기능', () => {
        test.fixme('리스트 필터 및 부가 기능 (기대결과 미작성)', async () => {});
    });

    test.describe('정렬', () => {
        test.fixme('리스트 정렬 (기대결과 미작성)', async () => {});
    });
});

// ─── 송무 전체 일정 (공통) ────────────────────────────────────────────────────

test.describe('송무 - 전체 일정 (공통)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LITIGATION.SCHEDULE);
    });

    test('송무 전체 일정 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/litigation\/schedule/);
    });

    test.describe('월별', () => {
        test.fixme('월별 tab이동 (기대결과 미작성)', async () => {});
        test.fixme('월별 사건일정 (기대결과 미작성)', async () => {});
        test.fixme('월별 이동 (기대결과 미작성)', async () => {});
        test.fixme('월별 일정분류 (기대결과 미작성)', async () => {});
    });

    test.describe('주별', () => {
        test.fixme('주별 tab이동 (기대결과 미작성)', async () => {});
        test.fixme('주별 사건일정 (기대결과 미작성)', async () => {});
        test.fixme('주별 이동 (기대결과 미작성)', async () => {});
        test.fixme('주별 일정분류 (기대결과 미작성)', async () => {});
    });

    test.describe('일별', () => {
        test.fixme('일별 tab이동 (기대결과 미작성)', async () => {});
        test.fixme('일별 사건일정 (기대결과 미작성)', async () => {});
        test.fixme('일별 이동 (기대결과 미작성)', async () => {});
        test.fixme('일별 일정분류 (기대결과 미작성)', async () => {});
    });
});

// ─── 송무 전체 일정 (법무 배정 담당자) ───────────────────────────────────────

test.describe('송무 - 전체 일정 (법무 배정 담당자)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LITIGATION.SCHEDULE);
    });

    test.describe('월별', () => {
        test.fixme('월별 tab이동 (기대결과 미작성)', async () => {});
        test.fixme('월별 사건일정 (기대결과 미작성)', async () => {});
        test.fixme('월별 이동 (기대결과 미작성)', async () => {});
        test.fixme('월별 일정분류 (기대결과 미작성)', async () => {});
    });

    test.describe('주별', () => {
        test.fixme('주별 tab이동 (기대결과 미작성)', async () => {});
        test.fixme('주별 사건일정 (기대결과 미작성)', async () => {});
        test.fixme('주별 이동 (기대결과 미작성)', async () => {});
        test.fixme('주별 일정분류 (기대결과 미작성)', async () => {});
    });

    test.describe('일별', () => {
        test.fixme('일별 tab이동 (기대결과 미작성)', async () => {});
        test.fixme('일별 사건일정 (기대결과 미작성)', async () => {});
        test.fixme('일별 이동 (기대결과 미작성)', async () => {});
        test.fixme('일별 일정분류 (기대결과 미작성)', async () => {});
    });
});

// ─── 시스템 메시지 ────────────────────────────────────────────────────────────

test.describe('송무 - 시스템 메시지', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.fixme('등록 시스템 메시지 (기대결과 미작성)', async () => {});
    test.fixme('법무담당자배정 시스템 메시지 (기대결과 미작성)', async () => {});
    test.fixme('사건일정업데이트 시스템 메시지 (기대결과 미작성)', async () => {});
    test.fixme('상세정보수정 시스템 메시지 (기대결과 미작성)', async () => {});
});
