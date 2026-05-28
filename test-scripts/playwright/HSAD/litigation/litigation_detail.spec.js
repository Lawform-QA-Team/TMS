import { test, expect } from '@playwright/test';
import { URLS, SELECTORS } from '../util/url_base_hsad.js';
import { login } from '../common/auth.js';

// 송무 상세 TC 전체 기대결과 미작성 (570건)
// 추후 TC 보완 후 구현 예정

// ─── 송무 상세 (송무 등록자) ──────────────────────────────────────────────────

test.describe('송무 상세 (송무 등록자)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.describe('담당자 배정 중', () => {
        test.fixme('담당자 배정 중 - tab이동 (기대결과 미작성)', async () => {});
        test.fixme('담당자 배정 중 - 구분 (기대결과 미작성)', async () => {});
        test.fixme('담당자 배정 중 - 기본정보 (기대결과 미작성)', async () => {});
        test.fixme('담당자 배정 중 - 상세정보 (기대결과 미작성)', async () => {});
    });

    test.describe('진행 중', () => {
        test.fixme('진행 중 - tab이동 (기대결과 미작성)', async () => {});
        test.fixme('진행 중 - 구분 (기대결과 미작성)', async () => {});
        test.fixme('진행 중 - 기본정보 (기대결과 미작성)', async () => {});
        test.fixme('진행 중 - 상세정보 (기대결과 미작성)', async () => {});
    });
});

// ─── 송무 상세 (법무 배정 담당자) ────────────────────────────────────────────

test.describe('송무 상세 (법무 배정 담당자)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.describe('담당자 배정 중', () => {
        test.fixme('담당자 배정 중 - tab이동 (기대결과 미작성)', async () => {});
        test.fixme('담당자 배정 중 - 구분 (기대결과 미작성)', async () => {});
        test.fixme('담당자 배정 중 - 기본정보 (기대결과 미작성)', async () => {});
        test.fixme('담당자 배정 중 - 상세정보 (기대결과 미작성)', async () => {});
    });

    test.describe('진행 중', () => {
        test.fixme('진행 중 - tab이동 (기대결과 미작성)', async () => {});
        test.fixme('진행 중 - 구분 (기대결과 미작성)', async () => {});
        test.fixme('진행 중 - 기본정보 (기대결과 미작성)', async () => {});
        test.fixme('진행 중 - 상세정보 (기대결과 미작성)', async () => {});
    });
});

// ─── 송무 상세 (법무 담당자) ──────────────────────────────────────────────────

test.describe('송무 상세 (법무 담당자)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.describe('진행 중', () => {
        test.fixme('진행 중 - tab이동 (기대결과 미작성)', async () => {});
        test.fixme('진행 중 - 구분 (기대결과 미작성)', async () => {});
        test.fixme('진행 중 - 기본정보 (기대결과 미작성)', async () => {});
        test.fixme('진행 중 - 상세정보 (기대결과 미작성)', async () => {});
    });
});

// ─── 송무 상세 (공통) ─────────────────────────────────────────────────────────

test.describe('송무 상세 (공통)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.describe('종결', () => {
        test.fixme('종결 - btn 동작 (기대결과 미작성)', async () => {});
        test.fixme('종결 - tab이동 (기대결과 미작성)', async () => {});
        test.fixme('종결 - 구분 (기대결과 미작성)', async () => {});
        test.fixme('종결 - 기본정보 (기대결과 미작성)', async () => {});
    });

    test.describe('중단', () => {
        test.fixme('중단 - btn 동작 (기대결과 미작성)', async () => {});
        test.fixme('중단 - tab이동 (기대결과 미작성)', async () => {});
        test.fixme('중단 - 구분 (기대결과 미작성)', async () => {});
        test.fixme('중단 - 기본정보 (기대결과 미작성)', async () => {});
    });
});
