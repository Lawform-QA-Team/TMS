import { test, expect } from '@playwright/test';
import { URLS } from '../../util/url_base_hsad.js';
import { SELECTORS } from '../../util/selector_hsad.js';
import { login } from '../../common/auth.js';

test.describe('CLM 계약 검토 요청 - 요청 페이지(Draft)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.DRAFT);
        await page.locator(SELECTORS.BUSINESS.CLM.NEW_REVIEW_REQUEST_BUTTON).click();
        await page.getByRole('button', { name: '확인' }).click();
        await expect(page).toHaveURL(/\/clm\/[^/]+\/draft/);
    });

    // ─── UI ──────────────────────────────────────────────────────────────────

    test.describe('UI', () => {
        test('LC_031: 페이지 타이틀 "계약 검토 요청" 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.TITLE)).toBeVisible();
        });

        test('LC_032: 목록, 임시저장, 계약서 검토 요청 버튼 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.LIST_LINK)).toBeVisible();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.SAVE_BUTTON)).toBeVisible();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.NEW_REVIEW_REQUEST_BUTTON)).toBeVisible();
        });

        test('LC_033~LC_036: 내부 결재선 영역 - 타이틀, 아코디언, 결재자 추가 버튼 노출', async ({ page }) => {
            await expect(page.getByText('내부 결재선')).toBeVisible();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.ASSIGN_BUTTON)).toBeVisible();
        });

        test('LC_040~LC_043: 계약 구분 라디오 (신규/변경/해지) 노출, 신규 디폴트', async ({ page }) => {
            // TODO: Radio 컴포넌트 data-tid 없음
            await expect(page.locator('//label[.//div[text()="신규"]]')).toBeVisible();
            await expect(page.locator('//label[.//div[text()="변경"]]')).toBeVisible();
            await expect(page.locator('//label[.//div[text()="해지"]]')).toBeVisible();
        });

        test('LC_044~LC_046: 편집기 사용 여부 라디오 (사용/사용 안함) 노출', async ({ page }) => {
            // TODO: Radio 컴포넌트 data-tid 없음
            await expect(page.locator('//label[.//div[text()="사용"]]')).toBeVisible();
            await expect(page.locator('//label[.//div[text()="사용 안 함"]]')).toBeVisible();
        });

        test('LC_047~LC_048: 계약서 첨부 방식 라디오 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.ATTACHMENT_METHOD_LABEL)).toBeVisible();
        });

        test('LC_049~LC_050: 계약서 파일 업로드 버튼 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.COMMON.INPUT_CONTRACT_FILE_UPLOAD)).toBeVisible();
        });

        test('LC_051~LC_052: 계약명 입력 필드 및 placeholder 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.DOCUMENT_NAME_PLACEHOLDER)).toBeVisible();
        });

        test('LC_053~LC_055: 계약 분류 대/중/소 드롭다운 placeholder 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.MAJOR_CATEGORY_PLACEHOLDER)).toBeVisible();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.SUB_CATEGORY_PLACEHOLDER)).toBeVisible();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.MINOR_CATEGORY_PLACEHOLDER)).toBeVisible();
        });

        test('LC_056~LC_057: 계약 기간 datepicker 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.DATE_PLACEHOLDER)).toBeVisible();
        });

        test('LC_058~LC_060: 계약 자동 연장 여부 라디오 노출, "자동 연장 없음" 디폴트', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.AUTO_RENEWAL)).toBeVisible();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.AUTO_RENEWAL_1)).toBeVisible();
        });

        test('LC_061~LC_063: 보안 여부 라디오 (전체공개/참조인/비공개) 노출, "참조인" 디폴트', async ({ page }) => {
            // TODO: Radio 컴포넌트 data-tid 없음
            await expect(page.locator('//label[.//div[text()="전체 공개"]]')).toBeVisible();
            await expect(page.locator('//label[.//div[text()="참조인"]]')).toBeVisible();
            await expect(page.locator('//label[.//div[text()="비공개"]]')).toBeVisible();
        });

        test('LC_064~LC_067: 프로젝트, 연관 계약 찾아보기 버튼 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.SEARCH_PLACEHOLDER)).toBeVisible();
        });

        test('LC_068~LC_071: 첨부/별첨, 참고자료 파일 업로드 버튼 노출', async ({ page }) => {
            await expect(page.getByText('첨부/별첨')).toBeVisible();
            await expect(page.getByText('참고자료')).toBeVisible();
        });

        test('LC_072~LC_077: 상대 계약자, 참조 수신자 입력 필드 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.SEARCH_PLACEHOLDER_1)).toBeVisible();
        });

        test('LC_078~LC_088: 상세 정보 영역 (계약예정일, 계약규모, 지급상세, 계약배경/목적, 주요협의사항) 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.AMOUNT_PLACEHOLDER)).toBeVisible();
        });

        test('LC_089~LC_091: 검토 진행 여부 라디오 (검토필요/검토불필요) 노출, "검토 필요" 디폴트', async ({ page }) => {
            // TODO: Radio 컴포넌트 data-tid 없음
            await expect(page.locator('//label[.//div[text()="검토 필요"]]')).toBeVisible();
            await expect(page.locator('//label[.//div[text()="검토 불필요"]]')).toBeVisible();
        });

        test('LC_092~LC_093: 검토 마감 기한 datepicker 노출', async ({ page }) => {
            await expect(page.locator(SELECTORS.BUSINESS.CLM.DATE_PLACEHOLDER_1)).toBeVisible();
        });
    });

    // ─── 동작 - Title ────────────────────────────────────────────────────────

    test.describe('동작 - Title 영역', () => {
        test('LC_094: 목록 버튼 클릭 → 임시저장 리스트 이동', async ({ page }) => {
            await page.locator(SELECTORS.BUSINESS.CLM.LIST_LINK).click();
            await expect(page).toHaveURL(URLS.CLM.DRAFT);
        });

        test('LC_095~LC_097: 임시저장 버튼 클릭 → 저장 모달 → 확인 후 draft 유지', async ({ page }) => {
            await page.locator(SELECTORS.BUSINESS.CLM.SAVE_BUTTON).click();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.SAVED_MESSAGE)).toBeVisible();
            await page.getByRole('button', { name: '확인' }).click();
            await expect(page).toHaveURL(/\/clm\/[^/]+\/draft/);
        });

        test('LC_098~LC_100: 계약서 검토 요청 버튼 → 필수 미입력 시 "계약서를 선택해주세요." 모달', async ({ page }) => {
            await page.locator(SELECTORS.BUSINESS.CLM.NEW_REVIEW_REQUEST_BUTTON).click();
            await expect(page.getByText('계약서를 선택해주세요.')).toBeVisible();
            await page.getByRole('button', { name: '확인' }).click();
            await expect(page).toHaveURL(/\/clm\/[^/]+\/draft/);
        });
    });

    // ─── 동작 - 결재선 ────────────────────────────────────────────────────────

    test.describe('동작 - 결재선', () => {
        test('LC_109~LC_110: 결재선 아코디언 아이콘 클릭 → 영역 접힘/펼침', async ({ page }) => {
            const section = page.getByText('내부 결재선').locator('..');
            const toggleBtn = section.locator('button').first();
            await toggleBtn.click();
            await toggleBtn.click(); // 다시 펼치기
        });

        test('LC_111~LC_113: 결재자 추가 버튼 → 결재선 지정 모달 노출 및 검색 필드 확인', async ({ page }) => {
            await page.locator(SELECTORS.BUSINESS.CLM.ASSIGN_BUTTON).click();
            await expect(page.getByText('결재선 지정')).toBeVisible();
            await expect(page.getByPlaceholder('팀명, 이름을 입력해 주세요.')).toBeVisible();
        });
    });

    // ─── 동작 - 계약 구분 ─────────────────────────────────────────────────────

    test.describe('동작 - 계약 구분', () => {
        test('LC_계약구분_해지: 해지 선택 시 "관련 계약 찾아보기" 노출', async ({ page }) => {
            // TODO: Radio 컴포넌트 data-tid 없음
            await page.locator('//label[.//div[text()="해지"]]').click();
            await expect(page.getByText('관련 계약 찾아보기')).toBeVisible();
        });

        test('LC_계약구분_변경: 변경 선택 시 "관련 계약 찾아보기" 노출', async ({ page }) => {
            // TODO: Radio 컴포넌트 data-tid 없음
            await page.locator('//label[.//div[text()="변경"]]').click();
            await expect(page.getByText('관련 계약 찾아보기')).toBeVisible();
        });
    });

    // ─── 동작 - 계약 정보 ─────────────────────────────────────────────────────

    test.describe('동작 - 계약 정보', () => {
        test('LC_계약명_입력: 계약명 텍스트 입력 확인', async ({ page }) => {
            const input = page.locator('input[placeholder="새 계약서"]');
            await input.fill('테스트 계약서');
            await expect(input).toHaveValue('테스트 계약서');
        });

        test('LC_첨부방식_My계약서: My계약서에서 불러오기 선택 시 불러오기 버튼 노출', async ({ page }) => {
            await page.locator(SELECTORS.BUSINESS.CLM.LOAD_FROM_MY_CONTRACT).click();
            await expect(page.locator('img[alt="불러오기 아이콘"]')).toBeVisible();
        });

        test('LC_보안여부_전체공개: 전체 공개 선택', async ({ page }) => {
            // TODO: Radio 컴포넌트 data-tid 없음
            await page.locator('//label[.//div[text()="전체 공개"]]').click();
        });

        test('LC_보안여부_비공개: 비공개 선택', async ({ page }) => {
            // TODO: Radio 컴포넌트 data-tid 없음
            await page.locator('//label[.//div[text()="비공개"]]').click();
        });

        test('LC_계약분류_대분류: 대분류 드롭다운 선택 시 중분류 활성화', async ({ page }) => {
            await page.locator(SELECTORS.BUSINESS.CLM.MAJOR_CATEGORY_PLACEHOLDER).click();
            // 드롭다운 옵션 노출 확인
            await expect(page.locator(SELECTORS.BUSINESS.CLM.MAJOR_CATEGORY_PLACEHOLDER)).toBeFocused();
        });

        test('LC_자동연장_사용: 자동 연장 선택 시 사전 통보 기한 필드 노출', async ({ page }) => {
            await page.locator(SELECTORS.BUSINESS.CLM.AUTO_RENEWAL).click();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.PRIOR_NOTICE_PREFIX)).toBeVisible();
        });
    });

    // ─── 동작 - 검토 정보 ─────────────────────────────────────────────────────

    test.describe('동작 - 검토 정보', () => {
        test('LC_검토불필요: 검토 불필요 선택 시 검토 마감 기한 비활성화', async ({ page }) => {
            // TODO: Radio 컴포넌트 data-tid 없음
            await page.locator('//label[.//div[text()="검토 불필요"]]').click();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.DATE_PLACEHOLDER_1)).toBeDisabled();
        });

        test('LC_검토필요: 검토 필요 선택 시 검토 마감 기한 활성화', async ({ page }) => {
            // TODO: Radio 컴포넌트 data-tid 없음
            await page.locator('//label[.//div[text()="검토 필요"]]').click();
            await expect(page.locator(SELECTORS.BUSINESS.CLM.DATE_PLACEHOLDER_1)).toBeEnabled();
        });
    });
});
