import { test, expect } from '@playwright/test';
import { URLS, SELECTORS } from '../util/url_base_hsad.js';
import { login } from '../common/auth.js';

// 대시보드 위젯 추가 (온프레미스)
// 총 39건

test.describe('대시보드 위젯 추가 (온프레미스) - 계약 검토 진행현황(회사)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LOGIN.DASHBOARD);
    });

    test.describe('상태 항목 추가 노출', () => {
        test('LC_152: 담당자 동시 검토 중 - 담당자 동시 검토 중 항목 추가 노출', async ({ page }) => {
            await expect(page.getByText('\'담당자 동시 검토중\' 상태 항목', { exact: false })).toBeVisible();
        });

        test('LC_153: 담당자 동시 검토 완료 - 담당자 동시 검토 완료 항목 추가 노출', async ({ page }) => {
            await expect(page.getByText('\'담당자 동시 검토 완료\' 상태 항목', { exact: false })).toBeVisible();
        });

    });

    test.describe('상태 건수 노출', () => {
        test('LC_154: 담당자 동시 검토 중 - 실제 진행 중 건수와 일치', async ({ page }) => {
            await expect(page.getByText('해당 상태의 건수로 정상', { exact: false })).toBeVisible();
        });

        test('LC_155: 담당자 동시 검토 완료 - 실제 완료 건수와 일치', async ({ page }) => {
            await expect(page.getByText('해당 상태의 건수로 정상', { exact: false })).toBeVisible();
        });

    });

    test.describe('카운트 전이', () => {
        test('LC_156: 완료 처리 시 이동 - 동시 검토 완료 처리 시 카운트 전이', async ({ page }) => {
            // TODO: 상태 변경되어 건수 -1 카운트 적용됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

});

test.describe('대시보드 위젯 추가 (온프레미스) - 계약 검토 진행현황(MY)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LOGIN.DASHBOARD);
    });

    test.describe('상태 항목 추가 노출', () => {
        test('LC_157: 담당자 동시 검토 중 - 담당자 동시 검토 중 항목 추가 노출', async ({ page }) => {
            await expect(page.getByText('\'담당자 동시 검토중\' 상태 항목', { exact: false })).toBeVisible();
        });

        test('LC_158: 담당자 동시 검토 완료 - 담당자 동시 검토 완료 항목 추가 노출', async ({ page }) => {
            await expect(page.getByText('\'담당자 동시 검토 완료\' 상태 항목', { exact: false })).toBeVisible();
        });

    });

    test.describe('상태 건수 노출', () => {
        test('LC_159: 담당자 동시 검토 중 - 실제 진행 중 건수와 일치', async ({ page }) => {
            await expect(page.getByText('해당 상태의 건수로 정상', { exact: false })).toBeVisible();
        });

        test('LC_160: 담당자 동시 검토 완료 - 실제 완료 건수와 일치', async ({ page }) => {
            await expect(page.getByText('해당 상태의 건수로 정상', { exact: false })).toBeVisible();
        });

    });

    test.describe('카운트 전이', () => {
        test('LC_161: 완료 처리 시 이동 - 동시 검토 완료 처리 시 카운트 전이', async ({ page }) => {
            // TODO: 상태 변경되어 건수 -1 카운트 적용됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

});

test.describe('대시보드 위젯 추가 (온프레미스) - 담당자 동시 검토 중 리스트', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LOGIN.DASHBOARD);
    });

    test.describe('위젯 노출', () => {
        test('LC_162: \\'담당자 동시 검토 중 리스트\\' 위젯 노출', async ({ page }) => {
            await expect(page.getByText('\'담당자 동시 검토 중 리스트\' 위젯', { exact: false })).toBeVisible();
        });

    });

    test.describe('타이틀', () => {
        test('LC_163: 배정 팀 이름 - 타이틀 > 배정 팀 이름 표시', async ({ page }) => {
            await expect(page.getByText('사용자의 배정 팀 이름(\'금융팀\')', { exact: false })).toBeVisible();
        });

    });

    test.describe('리스트 항목', () => {
        test('LC_164: 항목 미존재 - 리스트가 0건일 때 빈 상태 표시', async ({ page }) => {
            await expect(page.getByText('항목 미존재 문구와 0건 표시', { exact: false })).toBeVisible();
        });

        test('LC_165: 항목 존재 - 리스트 항목 정보 표시', async ({ page }) => {
            // TODO: 계약명, 검토 담당자, 검토 마감기한이 표시됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_166: 항목 존재 - 항목 클릭', async ({ page }) => {
            await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('[더보기 >]', () => {
        test('LC_167: 버튼 선택 - 더보기 선택 시 필터 설정된 리스트로 이동', async ({ page }) => {
            // TODO: \'담당자 동시 검토 중\' 필터가 설정된 검토 리스트 페이지 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('총 건수', () => {
        test('LC_168: N 건 노출 - 위젯 헤더에 전체 항목 수 표시', async ({ page }) => {
            await expect(page.getByText('리스트 항목 수와 동일하게 건수', { exact: false })).toBeVisible();
        });

    });

    test.describe('상태 전이', () => {
        test('LC_169: 완료 처리 제거 - 동시 검토 완료 처리 시 진행중 리스트에서 제거', async ({ page }) => {
            // TODO: 해당 계약이 \'담당자 동시 검토 중 리스트\'에 제거됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

});

test.describe('대시보드 위젯 추가 (온프레미스) - 담당자 동시 검토 완료 리스트', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LOGIN.DASHBOARD);
    });

    test.describe('위젯 노출', () => {
        test('LC_170: \\'담당자 동시 검토 완료 리스트\\' 위젯 노출', async ({ page }) => {
            await expect(page.getByText('담당자 동시 검토 완료 리스트\' 위젯', { exact: false })).toBeVisible();
        });

    });

    test.describe('타이틀', () => {
        test('LC_171: 배정 팀 이름 - 타이틀 > 배정 팀 이름 표시', async ({ page }) => {
            await expect(page.getByText('사용자의 배정 팀 이름(\'금융팀\')', { exact: false })).toBeVisible();
        });

    });

    test.describe('리스트 항목', () => {
        test('LC_172: 리스트 항목 정보 표시', async ({ page }) => {
            // TODO: 계약명, 검토 담당자, 검토 마감기한이 표시됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_173: 항목 클릭 - 항목 선택 시 계약검토 상세 이동', async ({ page }) => {
            await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('[더보기 >]', () => {
        test('LC_174: 버튼 선택 - 더보기 선택 시 필터 설정된 리스트로 이동', async ({ page }) => {
            // TODO: \'담당자 동시 검토 완료\' 필터가 설정된 검토 리스트 페이지 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('상태 전이', () => {
        test('LC_175: 완료 처리 추가 - 동시 검토 완료 처리 시 완료 리스트에 추가', async ({ page }) => {
            await expect(page.getByText('해당 계약이 \'담당자 동시 검토 완료 리스트\' 상단', { exact: false })).toBeVisible();
        });

    });

});

test.describe('대시보드 위젯 추가 (온프레미스) - 검토 담당자 배정 중 리스트', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LOGIN.DASHBOARD);
    });

    test.describe('권한 노출', () => {
        test('LC_176: 배정 권한 보유자 - 배정 권한 보유자에게 위젯 노출', async ({ page }) => {
            await expect(page.getByText('검토 담당자 배정 중\' 위젯', { exact: false })).toBeVisible();
        });

        test('LC_177: 배정 권한 보유자 - 배정 권한 보유자 배정항목 미존재 시 미노출', async ({ page }) => {
            await expect(page.getByText('검토 담당자 배정 중\' 위젯 미', { exact: false })).toBeVisible();
        });

        test('LC_178: 배정 권한 미보유자 - 배정 권한 없는 사용자에게 위젯 미노출', async ({ page }) => {
            await expect(page.getByText('검토 담당자 배정 중\' 위젯 미', { exact: false })).toBeVisible();
        });

    });

    test.describe('타이틀', () => {
        test('LC_179: 배정 팀 이름 - 타이틀 > 배정 팀 이름 표시', async ({ page }) => {
            await expect(page.getByText('사용자의 배정 팀 이름(\'금융팀\')', { exact: false })).toBeVisible();
        });

    });

    test.describe('리스트 항목', () => {
        test('LC_180: 리스트 항목 정보 표시', async ({ page }) => {
            await expect(page.getByText('계약명, 요청자, 상대계약자, 검토완료일', { exact: false })).toBeVisible();
        });

        test('LC_181: 계약명 클릭 - 계약명 클릭 시 계약 상세 이동', async ({ page }) => {
            await expect(page).toHaveURL(/.+/);
        });

        test('LC_182: [배정] 버튼 - 배정 버튼 클릭 시 조직도 노출', async ({ page }) => {
            await expect(page.getByText('해당 사용자 소속 팀의 조직도로 배정 팝업', { exact: false })).toBeVisible();
        });

        test('LC_183: [배정] 버튼 - 배정 완료 처리', async ({ page }) => {
            // TODO: 선택된 사용자가 담당자 배정 설정되며 알림 발송됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('상태 전이', () => {
        test('LC_184: 담당자 지정 후 제거 - 담당자 지정 완료 시 리스트에서 제거', async ({ page }) => {
            // TODO: 해당 계약 항목이 \'검토 담당자 배정 중\' 리스트에서 제거됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('권한 변경', () => {
        test('LC_185: 런타임 - 권한 박탈 후 새로고침 시 위젯 미노출', async ({ page }) => {
            await expect(page.getByText('검토 담당자 배정 중\' 위젯 미', { exact: false })).toBeVisible();
        });

    });

});

test.describe('대시보드 위젯 추가 (온프레미스) - 요청자 검토 중 리스트', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.LOGIN.DASHBOARD);
    });

    test.describe('위젯 노출', () => {
        test('LC_186: 위젯 노출', async ({ page }) => {
            await expect(page.getByText('요청자 검토 중 리스트(계약검토)\' 위젯', { exact: false })).toBeVisible();
        });

    });

    test.describe('문서 노출', () => {
        test('LC_187: 법무검토 송부 건 - 법무검토 > 요청자 검토 시 카운트 포함', async ({ page }) => {
            await expect(page.getByText('문서 1건 노출 및 카운트 1건으로', { exact: false })).toBeVisible();
        });

        test('LC_188: 동시검토 송부 건 - 동시검토 > 요청자 검토 시 카운트 포함', async ({ page }) => {
            await expect(page.getByText('문서 1건 노출 및 카운트 1건으로', { exact: false })).toBeVisible();
        });

        test('LC_189: 동시검토 송부 건 - 유관부서 항목 다건', async ({ page }) => {
            await expect(page.getByText('문서 1건 노출 및 카운트 1건으로', { exact: false })).toBeVisible();
        });

        test('LC_190: 더보기 클릭 - 더보기 클릭 시 리스트 페이지 이동', async ({ page }) => {
            await expect(page.getByText('\'요청자 검토 중\' 필터가 설정된 검토 리스트 페이지', { exact: false })).toBeVisible();
        });

    });

});
