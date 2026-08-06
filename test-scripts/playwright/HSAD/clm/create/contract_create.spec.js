import { test, expect } from '@playwright/test';
import { URLS } from '../../util/url_base_hsad.js';
import { login } from '../../common/auth.js';

test.describe('HSAD CLM - Contract Creation (Auto Doc)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('LC_001~LC_010: Auto Doc Search and UI', async ({ page }) => {
        // LC_001: 자동작성 화면 진입
        await page.goto(URLS.DRIVE.AUTO);
        await expect(page.getByText('어떤 법률문서를 작성할까요?')).toBeVisible();

        // LC_002: 전체/카테고리 탭 노출
        await expect(page.getByText('전체', { exact: true })).toBeVisible();
        await expect(page.getByText('카테고리', { exact: true })).toBeVisible();

        // LC_003: Placeholder 확인
        const searchInput = page.getByPlaceholder('찾으시는 문서명을 입력해주세요');
        await expect(searchInput).toBeVisible();

        // LC_004: 메뉴 노출 확인
        for (const menuName of ['내용증명', '지급명령', '계약서', '기타', '고소장']) {
            await expect(page.getByText(menuName, { exact: true })).toBeVisible();
        }

        // LC_005: 카테고리 탭 메뉴 노출 확인
        await page.getByText('카테고리', { exact: true }).click();
        for (const categoryName of ['기업법률', '생활법률', '즐겨찾기']) {
            await expect(page.getByText(categoryName, { exact: true })).toBeVisible();
        }

        // LC_006: 전체 탭으로 다시 이동 시 자동작성 첫 화면 유지
        await page.getByText('전체', { exact: true }).click();
        await expect(page).toHaveURL(/documents_finder/);
        await expect(page.getByText('어떤 법률문서를 작성할까요?')).toBeVisible();

        // LC_007: 입력 필드 focus 가능
        await searchInput.click();
        await expect(searchInput).toBeFocused();

        // LC_008: 텍스트 입력 확인
        await searchInput.fill('비밀유지계약서');
        await expect(searchInput).toHaveValue('비밀유지계약서');

        // LC_009: 입력 필드 활성화 시 자주찾는 법률문서 BEST 영역 노출
        await expect(page.getByText(/BEST|자주찾는 법률문서/)).toBeVisible();

        // LC_010: 입력 텍스트와 검색/삭제 컨트롤 노출
        await expect(searchInput).toHaveValue('비밀유지계약서');
        await expect(page.locator('button, [role="button"]').filter({ hasText: /검색|×|✕|삭제/ }).first()).toBeVisible();
    });
});
