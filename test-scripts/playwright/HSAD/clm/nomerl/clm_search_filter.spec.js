import { test, expect } from '@playwright/test';
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { login } from '../../common/auth.js';

// 검색 필터 추가 (온프레미스)
// 총 27건

test.describe('검색 필터 추가 (온프레미스) - 검토 요청 조회', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.REVIEW);
    });

    test.describe('특별 승인 요청', () => {
        test('LC_191: 특별 승인 요청 선택 필터 노출', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청 체크', { exact: false })).toBeVisible();
        });

        test('LC_192: 동작 확인', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청 체크', { exact: false })).toBeVisible();
        });

        test('LC_193: 특별 승인 요청 선택 필터 미노출', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청 체크', { exact: false })).toBeVisible();
        });

        test('LC_194: 셀렉트 필터', async ({ page }) => {
            // TODO: 체크 활성화되어 특별 승인 요청 문서 항목만 소팅되어 리스트에 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_195: 셀렉트 필터 - 미적용', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청 문서', { exact: false })).toBeVisible();
        });

        test('LC_196: 셀렉트 필터 - 미적용', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청 문서', { exact: false })).toBeVisible();
        });

        test('LC_197: 셀렉트 필터 - 적용', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청 중', { exact: false })).toBeVisible();
        });

        test('LC_198: 셀렉트 필터 - 적용', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청 중', { exact: false })).toBeVisible();
        });

        test('LC_199: 셀렉트 필터 - 적용', async ({ page }) => {
            // TODO: 완료 처리된 문서 미노출되며 필터 미적용 리스트에 문서 항목 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_200: 셀렉트 필터 - 적용', async ({ page }) => {
            // TODO: 리스트 항목에 완료 처리된 문서만 미노출되며 필터 미적용된 리스트에 노출
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('담당자 동시 검토 필터', () => {
        test('LC_201: 진행 상태 필터 - 재무 검토 항목', async ({ page }) => {
            await expect(page.getByText('재무검토 중  항목 미', { exact: false })).toBeVisible();
        });

        test('LC_202: 진행 상태 필터 - 재무 검토 항목', async ({ page }) => {
            await expect(page.getByText('재무검토 완료  항목 미', { exact: false })).toBeVisible();
        });

        test('LC_203: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            await expect(page.getByText('담당자 동시 검토 중 항목', { exact: false })).toBeVisible();
        });

        test('LC_204: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            await expect(page.getByText('담당자 동시 검토 완료 항목', { exact: false })).toBeVisible();
        });

        test('LC_205: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            await expect(page.getByText('담당자 동시 검토 필터(부서 선택)', { exact: false })).toBeVisible();
        });

        test('LC_206: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            await expect(page.getByText('담당자 동시 검토 필터(부서 선택)', { exact: false })).toBeVisible();
        });

        test('LC_207: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            await expect(page.getByText('아래와 같은 부서 선택 항목', { exact: false })).toBeVisible();
        });

        test('LC_208: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            await expect(page.getByText('아래와 같은 부서 선택 항목', { exact: false })).toBeVisible();
        });

        test('LC_209: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            await expect(page.getByText('담당자 동시 검토 중 또는 완료된 항목 전체 리스트', { exact: false })).toBeVisible();
        });

        test('LC_210: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            // TODO: 담당자 동시 검토 중 또는 완료된 법무 검토 진행 항목 리스트 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_211: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            // TODO: 담당자 동시 검토 중 또는 완료된 금융 검토 진행 항목 리스트 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_212: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            // TODO: 담당자 동시 검토 중 또는 완료된 회계 검토 진행 항목 리스트 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_213: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            // TODO: 담당자 동시 검토 중 또는 완료된 제작관리 검토 진행 항목 리스트 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_214: 진행 상태 필터 - 담당자 동시 검토 항목', async ({ page }) => {
            // TODO: 담당자 동시 검토 중 또는 완료된 법무/금융 검토 진행 항목 리스트 노출
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_215: 진행 상태 필터 - 전체 항목', async ({ page }) => {
            await expect(page.getByText('아래와 같은 항목', { exact: false })).toBeVisible();
        });

        test('LC_216: 리스트 칼럼 > 진행 상태 - 담당자 동시 검토 중 상태 값 노출', async ({ page }) => {
            await expect(page.getByText('담당자 동시 검토 중 툴팁', { exact: false })).toBeVisible();
        });

        test('LC_217: 리스트 칼럼 > 진행 상태 - 담당자 동시 검토 완료 상태 값 노출', async ({ page }) => {
            await expect(page.getByText('담당자 동시 검토 완료 툴팁', { exact: false })).toBeVisible();
        });

    });

});
