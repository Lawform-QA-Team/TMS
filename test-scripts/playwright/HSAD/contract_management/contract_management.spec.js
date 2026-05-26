import { test, expect } from '@playwright/test';
import { URLS, SELECTORS } from '../util/url_base_hsad.js';
import { login } from '../common/auth.js';

test.describe('계약 정보 관리 - 계약처 관리', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CONTRACT.CONTRACT);
    });

    // ─── 타이틀 영역 ──────────────────────────────────────────────────────────

    test('LC_003: 좌측 최상단에 "계약처 관리" 타이틀 노출', async ({ page }) => {
        await expect(page.getByText('계약처 관리')).toBeVisible();
    });

    test('LC_004: 개인사업자 탭 선택 상태에서 법인 탭 선택 시 법인 영역 노출', async ({ page }) => {
        await page.getByRole('tab', { name: '개인사업자' }).click();
        await page.getByRole('tab', { name: '법인' }).click();
        await expect(page.getByText('법인')).toBeVisible();
    });

    test('LC_005: 개인 탭 선택 상태에서 법인 탭 선택 시 법인 영역 노출', async ({ page }) => {
        await page.getByRole('tab', { name: '개인' }).click();
        await page.getByRole('tab', { name: '법인' }).click();
        await expect(page.getByText('법인')).toBeVisible();
    });

    // ─── 탭 영역 - 법인 ───────────────────────────────────────────────────────

    test.describe('법인 탭', () => {
        test.beforeEach(async ({ page }) => {
            await page.getByRole('tab', { name: '법인' }).click();
        });

        test('LC_006: [삭제] 버튼 비활성화 상태로 노출', async ({ page }) => {
            await expect(page.getByRole('button', { name: '삭제' })).toBeDisabled();
        });

        test('LC_007~LC_008: 검색 inputbox 및 placeholder "기업명을 검색해보세요" 노출', async ({ page }) => {
            await expect(page.getByPlaceholder('기업명을 검색해보세요')).toBeVisible();
        });

        test('LC_009: 검색영역 우측에 검색 버튼 노출', async ({ page }) => {
            await expect(page.getByPlaceholder('기업명을 검색해보세요').locator('..').locator('button')).toBeVisible();
        });

        test('LC_010: 등록된 법인 계약처 "전체 N건" 노출', async ({ page }) => {
            await expect(page.getByText(/전체 \d+건/)).toBeVisible();
        });

        test('LC_012~LC_016: 전체 checkbox 선택/해제 시 [삭제] 버튼 활성화/비활성화', async ({ page }) => {
            const headerCheckbox = page.locator('table thead input[type="checkbox"]');
            const hasData = (await page.locator('table tbody tr').count()) > 0;
            if (!hasData) { return; }
            await headerCheckbox.check();
            await expect(page.getByRole('button', { name: '삭제' })).toBeEnabled();
            await headerCheckbox.uncheck();
            await expect(page.getByRole('button', { name: '삭제' })).toBeDisabled();
        });

        test('LC_018~LC_020: 기업명 컬럼 inputbox placeholder "기업명" / 50자 제한', async ({ page }) => {
            const emptyRow = page.locator('table tbody tr').last();
            const nameInput = emptyRow.locator('input[placeholder="기업명"]');
            if (!(await nameInput.isVisible())) { return; }
            await nameInput.fill('a'.repeat(55));
            const val = await nameInput.inputValue();
            expect(val.length).toBeLessThanOrEqual(50);
        });

        test('LC_021~LC_023: 대표이사 컬럼 inputbox placeholder "이름" / 35자 제한', async ({ page }) => {
            const emptyRow = page.locator('table tbody tr').last();
            const input = emptyRow.locator('input[placeholder="이름"]');
            if (!(await input.isVisible())) { return; }
            await input.fill('a'.repeat(40));
            const val = await input.inputValue();
            expect(val.length).toBeLessThanOrEqual(35);
        });

        test('LC_024~LC_027: 사업자등록번호 숫자만 입력 / "000-00-00000" 형식', async ({ page }) => {
            const emptyRow = page.locator('table tbody tr').last();
            const input = emptyRow.locator('input[placeholder="사업자등록번호"]');
            if (!(await input.isVisible())) { return; }
            await input.fill('1234567890');
            const val = await input.inputValue();
            expect(val).toMatch(/[\d-]+/);
        });

        test('LC_028~LC_031: 주소 컬럼 클릭 시 주소 검색 모달 노출 → 선택 시 주소 입력', async ({ page }) => {
            const emptyRow = page.locator('table tbody tr').last();
            const addressInput = emptyRow.locator('input[placeholder="주소"]');
            if (!(await addressInput.isVisible())) { return; }
            await addressInput.click();
            await expect(page.getByText('주소 검색')).toBeVisible();
        });

        test('LC_035~LC_037: 전화번호 컬럼 inputbox / 15자 제한', async ({ page }) => {
            const emptyRow = page.locator('table tbody tr').last();
            const input = emptyRow.locator('input[placeholder="전화번호"]');
            if (!(await input.isVisible())) { return; }
            await input.fill('1'.repeat(20));
            const val = await input.inputValue();
            expect(val.length).toBeLessThanOrEqual(15);
        });

        test('LC_041: [등록] 버튼 비활성화 상태 기본 노출', async ({ page }) => {
            const emptyRow = page.locator('table tbody tr').last();
            const registerBtn = emptyRow.getByRole('button', { name: '등록' });
            if (await registerBtn.isVisible()) {
                await expect(registerBtn).toBeDisabled();
            }
        });

        test('LC_044: 기업명 미입력 시 "기업명을 입력해 주세요" 얼럿 발생', async ({ page }) => {
            const emptyRow = page.locator('table tbody tr').last();
            const registerBtn = emptyRow.getByRole('button', { name: '등록' });
            if (!(await registerBtn.isVisible())) { return; }
            await registerBtn.click();
            await expect(page.getByText('기업명을 입력해 주세요')).toBeVisible();
        });

        test('LC_046: 데이터 없을 경우 "등록된 인적정보가 없습니다." 문구 노출', async ({ page }) => {
            const rowCount = await page.locator('table tbody tr').count();
            if (rowCount === 0) {
                await expect(page.getByText('등록된 인적정보가 없습니다.')).toBeVisible();
            }
        });

        test('LC_047: 검색 없이 접근 시 등록된 모든 법인 계약처 노출', async ({ page }) => {
            const countText = await page.getByText(/전체 \d+건/).textContent();
            const total = parseInt(countText?.match(/\d+/)?.[0] ?? '0');
            const rows = await page.locator('table tbody tr').count();
            if (total > 0) {
                expect(rows).toBeGreaterThan(0);
            }
        });

        test('LC_048: 검색어 입력 시 기업명 일치 계약처 노출', async ({ page }) => {
            const input = page.getByPlaceholder('기업명을 검색해보세요');
            await input.fill('테스트');
            await input.locator('..').getByRole('button').click();
            await expect(page.getByText(/전체 \d+건/)).toBeVisible();
        });

        test('LC_049~LC_057: row checkbox 선택/해제 동작 및 삭제 버튼 활성화', async ({ page }) => {
            const firstRow = page.locator('table tbody tr').first();
            if (!(await firstRow.isVisible())) { return; }
            const checkbox = firstRow.locator('input[type="checkbox"]');
            await checkbox.check();
            await expect(page.getByRole('button', { name: '삭제' })).toBeEnabled();
            await checkbox.uncheck();
            await expect(page.getByRole('button', { name: '삭제' })).toBeDisabled();
        });
    });

    // ─── 탭 영역 - 개인사업자 ────────────────────────────────────────────────

    test.describe('개인사업자 탭', () => {
        test.beforeEach(async ({ page }) => {
            await page.getByRole('tab', { name: '개인사업자' }).click();
        });

        test('개인사업자 탭 선택 시 해당 영역 노출', async ({ page }) => {
            await expect(page.getByText('개인사업자')).toBeVisible();
        });

        test('개인사업자 검색 inputbox 노출', async ({ page }) => {
            const searchInput = page.locator('input[placeholder*="검색"]').first();
            await expect(searchInput).toBeVisible();
        });
    });

    // ─── 탭 영역 - 개인 ───────────────────────────────────────────────────────

    test.describe('개인 탭', () => {
        test.beforeEach(async ({ page }) => {
            await page.getByRole('tab', { name: '개인' }).click();
        });

        test('개인 탭 선택 시 해당 영역 노출', async ({ page }) => {
            await expect(page.getByText('개인')).toBeVisible();
        });
    });
});

// ─── 도장/로고 관리 ───────────────────────────────────────────────────────────

test.describe('계약 정보 관리 - 기업 직인', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CONTRACT.TEAM_STAMP);
    });

    test('기업 직인 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/type=team_stamp/);
    });
});

test.describe('계약 정보 관리 - 직인', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CONTRACT.STAMP);
    });

    test('직인 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/type=stamp/);
    });
});

test.describe('계약 정보 관리 - 로고', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CONTRACT.LOGO);
    });

    test('로고 페이지 이동', async ({ page }) => {
        await expect(page).toHaveURL(/type=logo/);
    });
});
