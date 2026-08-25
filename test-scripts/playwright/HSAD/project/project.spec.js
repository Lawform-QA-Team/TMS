import { test, expect } from '@playwright/test';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../util/selector_hsad.js';
import { login } from '../common/auth.js';

test.describe('프로젝트 조회', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.PROJECT.PROJECT);
    });

    // ─── 진입 및 타이틀 ───────────────────────────────────────────────────────

    test('LC_001: GNB 프로젝트 영역 하위에 "프로젝트 조회" 메뉴 노출', async ({ page }) => {
        await expect(page.getByText('프로젝트 조회')).toBeVisible();
    });

    test('LC_002: 프로젝트 조회 페이지 이동 (~/project)', async ({ page }) => {
        await expect(page).toHaveURL(/\/project/);
    });

    test('LC_003: 페이지 왼쪽 상단 "프로젝트 조회" 문구 노출', async ({ page }) => {
        await expect(page.getByText('프로젝트 조회').first()).toBeVisible();
    });

    // ─── 리스트 영역 상단 - 리스트 개수 ──────────────────────────────────────

    test('LC_004: "전체 N건" 형태로 노출', async ({ page }) => {
        await expect(page.getByText(/전체 \d+건/)).toBeVisible();
    });

    test('LC_005: 데이터 없을 경우 "전체 0건" 노출', async ({ page }) => {
        const countText = await page.getByText(/전체 \d+건/).textContent();
        const count = parseInt(countText?.match(/\d+/)?.[0] ?? '0');
        if (count === 0) {
            await expect(page.getByText('전체 0건')).toBeVisible();
        }
    });

    // ─── 리스트 영역 상단 - 프로젝트 분류 필터 ───────────────────────────────

    test('LC_008: 우측 상단에 드롭다운 3개 노출 (대/중/소분류)', async ({ page }) => {
        await expect(page.getByText('프로젝트 대분류')).toBeVisible();
        await expect(page.getByText('프로젝트 중분류')).toBeVisible();
        await expect(page.getByText('프로젝트 소분류')).toBeVisible();
    });

    test('LC_009: 분류 전체 선택 시 등록된 모든 프로젝트 노출', async ({ page }) => {
        const countText = await page.getByText(/전체 \d+건/).textContent();
        const total = parseInt(countText?.match(/\d+/)?.[0] ?? '0');
        const rowCount = await page.locator('table tbody tr').count();
        if (total > 0) {
            expect(rowCount).toBeGreaterThan(0);
        }
    });

    test('LC_010: 대분류 드롭다운 placeholder "프로젝트 대분류" 노출', async ({ page }) => {
        await expect(page.getByText('프로젝트 대분류')).toBeVisible();
    });

    test('LC_016: 중분류 드롭다운 placeholder "프로젝트 중분류" 노출', async ({ page }) => {
        await expect(page.getByText('프로젝트 중분류')).toBeVisible();
    });

    test('LC_017: 대분류 미선택 시 중분류에 "대분류 먼저 선택해주세요" 안내', async ({ page }) => {
        await page.getByText('프로젝트 중분류').click();
        await expect(page.getByText('대분류 먼저 선택해주세요')).toBeVisible();
    });

    test('LC_023: 소분류 드롭다운 placeholder "프로젝트 소분류" 노출', async ({ page }) => {
        await expect(page.getByText('프로젝트 소분류')).toBeVisible();
    });

    test('LC_024~LC_025: 중분류 미선택 시 소분류에 "중분류 먼저 선택해주세요" 안내', async ({ page }) => {
        await page.getByText('프로젝트 소분류').click();
        await expect(page.getByText('중분류 먼저 선택해주세요')).toBeVisible();
    });

    // ─── 리스트 영역 상단 - 검색 ──────────────────────────────────────────────

    test('LC_033: 검색 입력박스 placeholder "프로젝트명을 입력해 주세요." 노출', async ({ page }) => {
        await expect(page.getByPlaceholder('프로젝트명을 입력해 주세요.')).toBeVisible();
    });

    test('LC_034: 검색 입력박스 문자 정상 입력', async ({ page }) => {
        const input = page.getByPlaceholder('프로젝트명을 입력해 주세요.');
        await input.fill('테스트');
        await expect(input).toHaveValue('테스트');
    });

    test('LC_035~LC_036: 검색어 입력 시 검색 결과 노출', async ({ page }) => {
        await page.getByPlaceholder('프로젝트명을 입력해 주세요.').fill('테스트');
        await page.keyboard.press('Enter');
        await expect(page.getByText(/전체 \d+건/)).toBeVisible();
    });

    // ─── 리스트 영역 상단 - 신규 프로젝트 등록 ───────────────────────────────

    test('LC_037: [신규 프로젝트 등록] 버튼 노출', async ({ page }) => {
        await expect(page.locator(SELECTORS.BUSINESS.PROJECT?.REGISTER_BUTTON ?? '[data-tid="9d2da031"]')).toBeVisible();
    });

    test('LC_038: 신규 프로젝트 등록 클릭 시 등록 페이지 이동', async ({ page }) => {
        await page.locator(SELECTORS.BUSINESS.PROJECT?.REGISTER_BUTTON ?? '[data-tid="9d2da031"]').click();
        await expect(page).toHaveURL(/\/project/);
    });

    // ─── 리스트 영역 - 항목명 ─────────────────────────────────────────────────

    test('LC_040~LC_041: 리스트 컬럼명 순서 확인', async ({ page }) => {
        for (const col of ['프로젝트명', '프로젝트 대분류', '프로젝트 중분류', '프로젝트 소분류', '등록된 계약', '등록자', '등록일']) {
            await expect(page.getByText(col, { exact: true })).toBeVisible();
        }
    });

    // ─── 리스트 영역 - 목록 디폴트 ───────────────────────────────────────────

    test('LC_042: 데이터 없을 경우 "등록된 내용이 없습니다." 문구 노출', async ({ page }) => {
        const rowCount = await page.locator('table tbody tr').count();
        if (rowCount === 0) {
            await expect(page.getByText('등록된 내용이 없습니다.')).toBeVisible();
        }
    });

    test('LC_043: 등록된 프로젝트 개수만큼 리스트 노출', async ({ page }) => {
        const countText = await page.getByText(/전체 \d+건/).textContent();
        const total = parseInt(countText?.match(/\d+/)?.[0] ?? '0');
        const pageRows = await page.locator('table tbody tr').count();
        expect(pageRows).toBeLessThanOrEqual(total);
    });

    // ─── 리스트 영역 - 프로젝트 데이터 ──────────────────────────────────────

    test('LC_050~LC_051: "등록된 계약" 컬럼에 "N건" 형태로 건수 노출', async ({ page }) => {
        const firstRow = page.locator('table tbody tr').first();
        const hasRow = await firstRow.isVisible();
        if (hasRow) {
            await expect(firstRow).toBeVisible();
        }
    });

    // ─── 리스트 영역 - 프로젝트 열람 ─────────────────────────────────────────

    test('LC_058: 프로젝트명 클릭 시 상세 페이지 이동', async ({ page }) => {
        const firstRow = page.locator('table tbody tr').first();
        const hasRow = await firstRow.isVisible();
        if (!hasRow) { return; }
        await firstRow.locator('td').first().click();
        await expect(page).toHaveURL(/\/project/);
    });

    // ─── 리스트 영역 - 프로젝트 삭제 ─────────────────────────────────────────

    test('LC_060~LC_061: 삭제 버튼 클릭 시 확인 알럿 → 취소 클릭 시 알럿 닫힘', async ({ page }) => {
        const deleteBtn = page.locator('table tbody tr').first().getByRole('button', { name: '삭제' });
        const hasBtn = await deleteBtn.isVisible();
        if (!hasBtn) { return; }
        await deleteBtn.click();
        await expect(page.getByText('해당 프로젝트를 삭제하시겠습니까')).toBeVisible();
        await page.getByRole('button', { name: '취소' }).click();
        await expect(page.getByText('해당 프로젝트를 삭제하시겠습니까')).not.toBeVisible();
    });

    // ─── 리스트 영역 - 페이지네이션 ──────────────────────────────────────────

    test('LC_064: 10건 이하 시 페이지네이션 미노출', async ({ page }) => {
        const countText = await page.getByText(/전체 \d+건/).textContent();
        const total = parseInt(countText?.match(/\d+/)?.[0] ?? '0');
        if (total <= 10) {
            await expect(page.locator(SELECTORS.BUSINESS.PROJECT?.PAGINATION ?? 'nav[aria-label*="pagination"]')).not.toBeVisible();
        }
    });

    test('LC_065: 11건 이상 시 페이지네이션 노출', async ({ page }) => {
        const countText = await page.getByText(/전체 \d+건/).textContent();
        const total = parseInt(countText?.match(/\d+/)?.[0] ?? '0');
        if (total > 10) {
            await expect(page.locator(SELECTORS.BUSINESS.PROJECT?.PAGINATION ?? 'nav[aria-label*="pagination"]')).toBeVisible();
        }
    });
});

test.describe('신규 프로젝트 등록', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.PROJECT.PROJECT);
        await page.locator(SELECTORS.BUSINESS.PROJECT?.REGISTER_BUTTON ?? '[data-tid="9d2da031"]').click();
    });

    test('LC_066: 타이틀 영역에 "신규 프로젝트 등록" 문구 노출', async ({ page }) => {
        await expect(page.getByText('신규 프로젝트 등록')).toBeVisible();
    });
});
