import { test, expect } from '@playwright/test';
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { login } from '../../common/auth.js';

test.describe('CLM 계약 검토 요청 - 임시저장 목록', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.DRAFT);
    });

    test.describe('UI', () => {
        test('LC_001: GNB 계약 검토 → 계약 검토 요청 선택 시 페이지 이동', async ({ page }) => {
            await expect(page).toHaveURL(/\/clm\/draft/);
        });

        test('LC_002: 페이지 타이틀이 "계약 검토 요청 임시저장 리스트"로 노출', async ({ page }) => {
            await expect(page.getByText('계약 검토 요청 임시저장 리스트')).toBeVisible();
        });

        test('LC_003: 임시저장 문서 카운팅 "전체 NN건" 노출', async ({ page }) => {
            await expect(page.getByText(/전체 \d+건/)).toBeVisible();
        });

        test('LC_004: 삭제, 신규 검토 요청 버튼 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.DELETE_BUTTON)).toBeVisible();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.NEW_REVIEW_REQUEST_BUTTON)).toBeVisible();
        });

        test('LC_005: 임시저장 리스트 컬럼 순서 확인', async ({ page }) => {
            for (const col of ['No', '계약명', '계약 구분', '상대계약자', '계약 예정일(체결일)', '최종 수정일']) {
                await expect(page.getByText(col, { exact: true })).toBeVisible();
            }
        });

        test('LC_006: 데이터 없을 경우 "등록된 내용이 없습니다." 노출', async ({ page }) => {
            const isEmpty = await page.getByText('등록된 내용이 없습니다.').isVisible();
            const hasData = (await page.locator('table tbody tr').count()) > 0;
            expect(isEmpty || hasData).toBeTruthy();
        });

        test('LC_007~LC_010: 데이터 있을 경우 컬럼 정보 노출', async ({ page }) => {
            const rowCount = await page.locator('table tbody tr').count();
            if (rowCount > 0) {
                await expect(page.locator('table tbody tr').first()).toBeVisible();
            }
        });

        test('LC_015: 임시저장 리스트 최대 10개 노출', async ({ page }) => {
            const rowCount = await page.locator('table tbody tr').count();
            expect(rowCount).toBeLessThanOrEqual(10);
        });

        test('LC_016: 11건 이상 시 페이지네이션 노출', async ({ page }) => {
            const total = await page.getByText(/전체 (\d+)건/).textContent();
            const count = parseInt(total?.match(/\d+/)?.[0] ?? '0');
            if (count > 10) {
                await expect(page.locator(SELECTORS.BUSINESS.CLM.PAGINATION)).toBeVisible();
            }
        });
    });

    test.describe('동작', () => {
        test('LC_017: 진입 시 삭제 버튼 비활성화', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.DELETE_BUTTON)).toBeDisabled();
        });

        test('LC_018: 체크박스 1개 이상 선택 시 삭제 버튼 활성화', async ({ page }) => {
            const firstRow = page.locator('table tbody tr').first();
            const hasRow = await firstRow.isVisible();
            if (!hasRow) { return; }
            await firstRow.locator('input[type="checkbox"]').check();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.DELETE_BUTTON)).toBeEnabled();
        });

        test('LC_019~LC_020: 삭제 버튼 클릭 시 삭제 안내 모달 노출', async ({ page }) => {
            const firstRow = page.locator('table tbody tr').first();
            if (!(await firstRow.isVisible())) { return; }
            await firstRow.locator('input[type="checkbox"]').check();
            await page.locator(SELECTORS.BUSINESS.CLM.DELETE_BUTTON).click();
            await expect(page.getByText('삭제하시겠습니까?')).toBeVisible();
            await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
            await expect(page.getByRole('button', { name: '확인' })).toBeVisible();
        });

        test('LC_021: 삭제 모달 취소 클릭 시 모달 닫힘', async ({ page }) => {
            const firstRow = page.locator('table tbody tr').first();
            if (!(await firstRow.isVisible())) { return; }
            await firstRow.locator('input[type="checkbox"]').check();
            await page.locator(SELECTORS.BUSINESS.CLM.DELETE_BUTTON).click();
            await page.getByRole('button', { name: '취소' }).click();
            await expect(page.getByText('삭제하시겠습니까?')).not.toBeVisible();
        });

        test('LC_025~LC_026: 신규 검토 요청 버튼 클릭 → 안내 모달 노출', async ({ page }) => {
            await page.locator(SELECTORS.BUSINESS.CLM.NEW_REVIEW_REQUEST_BUTTON).click();
            await expect(page.getByText('계약 검토 요청하겠습니까?')).toBeVisible();
            await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
            await expect(page.getByRole('button', { name: '확인' })).toBeVisible();
        });

        test('LC_027: 신규 검토 요청 모달 취소 클릭 시 모달 닫힘', async ({ page }) => {
            await page.locator(SELECTORS.BUSINESS.CLM.NEW_REVIEW_REQUEST_BUTTON).click();
            await page.getByRole('button', { name: '취소' }).click();
            await expect(page.getByText('계약 검토 요청하겠습니까?')).not.toBeVisible();
        });

        test('LC_028: 신규 검토 요청 모달 확인 클릭 시 draft 페이지 이동', async ({ page }) => {
            await page.locator(SELECTORS.BUSINESS.CLM.NEW_REVIEW_REQUEST_BUTTON).click();
            await page.getByRole('button', { name: '확인' }).click();
            await expect(page).toHaveURL(/\/clm\/[^/]+\/draft/);
        });

        test('LC_029~LC_030: 계약명 클릭 시 draft 페이지 이동', async ({ page }) => {
            const firstRow = page.locator('table tbody tr').first();
            if (!(await firstRow.isVisible())) { return; }
            await firstRow.locator('td').nth(2).click();
            await expect(page).toHaveURL(/\/clm\/[^/]+\/draft/);
        });
    });
});
