import { test, expect } from '@playwright/test';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../util/selector_hsad.js';
import { login } from '../common/auth.js';

test.describe('시스템 설정 - 구성원 관리', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.SETTING.TEAM);
    });

    test('구성원 관리 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/teams/);
    });

    // ─── UI 확인 ──────────────────────────────────────────────────────────────

    test.fixme('LC_001~LC_011: 구성원 관리 UI (마스터/일반 계정, 기대결과 미작성)', async () => {});

    // ─── 구성원 관리 상세 ─────────────────────────────────────────────────────

    test.fixme('LC_구성원_상세: 구성원 관리 상세 (기대결과 미작성)', async () => {});

    test('LC_252: 보안여부 아이콘 표시 확인 (전체공개 아이콘 없음 / 참조인 방패 / 비공개 자물쇠)', async ({ page }) => {
        // TODO: 실제 보안여부 아이콘 selector 확인 필요
        await expect(page).toHaveURL(/\/teams/);
    });

    // ─── 구성원 활성/비활성화 ─────────────────────────────────────────────────

    test.fixme('LC_활성비활성: 구성원 활성/비활성화 Toggle (기대결과 미작성)', async () => {});

    // ─── 조직 트리 ────────────────────────────────────────────────────────────

    test.fixme('LC_조직트리: 조직 트리 동작 (기대결과 미작성)', async () => {});

    // ─── 권한 필터 ────────────────────────────────────────────────────────────

    test.fixme('LC_302: 권한 필터 (개발 누락)', async () => {});
});

test.describe('시스템 설정 - 계정', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.SETTING.ACCOUNT);
    });

    test('계정 설정 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/type=account/);
    });

    test.fixme('시스템 설정 계정 UI 및 동작 (기대결과 미작성)', async () => {});
});

test.describe('시스템 설정 - Setup', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.SETTING.SETUP);
    });

    test('시스템 설정 Setup 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/\/setup/);
    });

    test.fixme('시스템 설정 기능 동작 확인 (기대결과 미작성)', async () => {});
});
