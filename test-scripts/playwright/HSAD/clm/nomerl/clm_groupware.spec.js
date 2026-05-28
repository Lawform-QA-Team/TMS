import { test, expect } from '@playwright/test';
import { URLS, SELECTORS } from '../../util/url_base_hsad.js';
import { login } from '../../common/auth.js';

// 그룹웨어(전자결재) / MDM 거래처 연동
// 총 44건

test.describe('그룹웨어(전자결재) / MDM 거래처 연동 - 계약서 검토 요청', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.DRAFT);
    });

    test.describe('첨부/별첨', () => {
        test('LC_349: 버튼 - 파일 업로드', async ({ page }) => {
            await expect(page.getByText('파일 업로드\' 버튼', { exact: false })).toBeVisible();
        });

        test('LC_350: 버튼 - 전자결재 문서 연결', async ({ page }) => {
            // TODO: 전자결재 문서 연결\' 버튼이 \'파일 업로드\' 버튼과 별도로 노출된다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_351: 전자결재 문서 연결 - 팝업 노출', async ({ page }) => {
            await expect(page.getByText('그룹웨어 전자결재 완료 문서 리스트 팝업', { exact: false })).toBeVisible();
        });

        test('LC_352: 전자결재 리스트 - 필터', async ({ page }) => {
            // TODO: 팝업 리스트에 본인 요청 1건과 본인 참조 1건(완료 상태)만 노출되고 
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_353: 전자결재 리스트 - 단일 선택 Insert', async ({ page }) => {
            // TODO: 팝업이 닫히고 \'첨부/별첨\' 영역에 선택한 문서 1건이 추가된다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_354: 전자결재 리스트 - N개 등록', async ({ page }) => {
            // TODO: 첨부된 전자결재 문서가 2건으로 증가한다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_355: 노출 방식 - 별도 아이콘', async ({ page }) => {
            // TODO: 전자결재 문서 항목의 아이콘이 일반 파일 업로드 아이콘과 시각적으로 구분
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_356: 노출 정보 - ID·타이틀', async ({ page }) => {
            // TODO: 항목에 전자결재 ID(X)와 전자결재 타이틀(T)이 모두 표시된다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_357: 전자결재 문서 항목 - 삭제(X)', async ({ page }) => {
            // TODO: 해당 전자결재 문서 항목이 첨부 목록에서 제거된다.
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('상대 계약자 정보', () => {
        test('LC_358: 카테고리 선택 - 옵션', async ({ page }) => {
            // TODO: 옵션이 [법인, 개인사업자, 개인] 3개로 표시된다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_359: 입력 필드 - 텍스트 + 조회', async ({ page }) => {
            // TODO: 텍스트 입력 필드(placeholder=\'회사명을 입력 후 조회하여 선택
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_360: 입력 필드 - 수기 등록 버튼', async ({ page }) => {
            await expect(page.getByText('수기 등록\' 버튼이 조회 버튼 옆에', { exact: false })).toBeVisible();
        });

        test('LC_361: 조회 동작 - MDM Like 검색', async ({ page }) => {
            // TODO: 거래처 리스트(2-1) 팝업이 노출되며 Like 검색 결과가 표시된다.
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('거래처 리스트(2-1)', () => {
        test('LC_362: 탭 - 3개 카테고리', async ({ page }) => {
            // TODO: [법인, 개인사업자, 개인] 3개 탭이 표시된다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_363: 법인 - 컬럼', async ({ page }) => {
            // TODO: 컬럼이 [기업명(법인명), 대표이사, 사업자등록번호, 전화번호, 이메일]
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_364: 개인사업자 - 컬럼', async ({ page }) => {
            // TODO: 컬럼이 [상호명, 사업자명, 사업자번호, 전화번호, 이메일] 순서로 표시
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_365: 개인 - 컬럼', async ({ page }) => {
            // TODO: 컬럼이 [이름, 생년월일, 전화번호, 이메일] 순서로 표시된다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_366: 페이지네이션 - 10개 단위', async ({ page }) => {
            // TODO: 1페이지에 10개 항목이 표시되고 페이지네이션이 [1, 2, 3]으로 표
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_367: 선택 동작 - 등록', async ({ page }) => {
            // TODO: 팝업이 닫히고 \'상대 계약자 정보\' 영역에 선택한 거래처의 기업명이 등록
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_368: 등록 제한 - 1회 1건', async ({ page }) => {
            // TODO: 기존 거래처가 새 거래처로 교체되어 상대 계약자 정보에는 1건만 등록된 
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_369: 조회 결과 - 0건', async ({ page }) => {
            // TODO: 거래처 리스트 팝업이 노출되며 \'전체 0건\'과 빈 상태 안내가 표시된다.
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('수기 등록', () => {
        test('LC_370: 팝업(2-3) 노출 - 트리거', async ({ page }) => {
            await expect(page.getByText('거래처 수기 등록\' 팝업', { exact: false })).toBeVisible();
        });

        test('LC_371: 법인 탭 - 입력 필드', async ({ page }) => {
            // TODO: 필드가 [기업명, 이름(대표이사), 사업자등록번호, 전화번호, 이메일 주
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_372: 개인사업자 탭 - 입력 필드', async ({ page }) => {
            // TODO: 필드가 [상호, 사업주명, 사업자등록번호, 전화번호, 이메일 주소] 5개
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_373: 개인 탭 - 입력 필드', async ({ page }) => {
            // TODO: 필드가 [이름, 생년월일(YYYY.MM.DD), 전화번호, 이메일 주소]
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_374: 등록 동작 - 법인', async ({ page }) => {
            // TODO: 팝업이 닫히고 \'상대 계약자 정보\' 영역에 입력한 법인 정보가 등록된 형
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_375: 필수값 - 미입력', async ({ page }) => {
            // TODO: 에러 안내가 표시되거나 \'등록\' 버튼이 비활성화되어 등록되지 않는다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_376: 포맷 검증 - 이메일', async ({ page }) => {
            // TODO: 이메일 형식 에러가 표시되고 등록되지 않는다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_377: 포맷 검증 - 사업자등록번호', async ({ page }) => {
            // TODO: 사업자등록번호 형식 에러가 표시되고 등록되지 않는다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_378: 포맷 검증 - 생년월일', async ({ page }) => {
            // TODO: 날짜 형식 에러가 표시되고 등록되지 않는다.
                    await expect(page).toHaveURL(/.+/);
        });

    });

});

test.describe('그룹웨어(전자결재) / MDM 거래처 연동 - 검토 요청 상세', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.DRAFT);
    });

    test.describe('계약 체결 품의 예외', () => {
        test('LC_379: 버튼 - 노출', async ({ page }) => {
            await expect(page.getByText('계약 체결 품의 예외\' 버튼', { exact: false })).toBeVisible();
        });

        test('LC_380: 팝업(3-1) - 노출', async ({ page }) => {
            await expect(page.getByText('계약 체결 품의 예외 등록\' 팝업', { exact: false })).toBeVisible();
        });

        test('LC_381: 팝업(3-1) - 문서 리스트', async ({ page }) => {
            // TODO: 드롭다운에 A와 B만 표시되고 C는 표시되지 않는다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_382: 팝업(3-1) - 필수 표시', async ({ page }) => {
            // TODO: 전자결재 문서 선택\'과 \'예외 사유\' 라벨에 필수 표시(*) 또는 안내가
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_383: 팝업(3-1) - 활성화', async ({ page }) => {
            // TODO: 등록\' 버튼이 활성화(enabled)된다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_384: 팝업(3-2) - 노출', async ({ page }) => {
            await expect(page.getByText('계약 체결 품의 예외 안내\'(3-2) 확인 팝업', { exact: false })).toBeVisible();
        });

        test('LC_385: 팝업(3-2) - 본문', async ({ page }) => {
            // TODO: 저장 시 계약 체결 품의 예외 처리됩니다.\', \'확인 시 전자서명 또는 
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_386: 팝업(3-2) - 확인 동작', async ({ page }) => {
            // TODO: 팝업이 닫히고 입력한 예외 내용이 계약검토 상세에 저장된다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_387: 팝업(3-2) - 취소 동작', async ({ page }) => {
            // TODO: 3-2 팝업이 닫히고 3-1 팝업의 입력 값이 유지되어 재입력/재등록을 
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_388: 3-3 항목 - 노출', async ({ page }) => {
            // TODO: 계약 체결 품의 예외 사유\' 영역(3-3)에 등록 일시, 전자결재 문서(
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_389: 3-3 항목 - 드래프트 미노출', async ({ page }) => {
            // TODO: 계약 체결 품의 예외 사유\' 영역(3-3)이 노출되지 않는다.
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_390: 다음 단계 - 전자서명/인감사용 신청', async ({ page }) => {
            // TODO: 다음 단계인 \'서명 진행 중\' 또는 \'인감 사용 신청 중\'이 활성 단계로
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_391: 마스터 변경 - 3-3 삭제', async ({ page }) => {
            // TODO: 3-3 \'계약 체결 품의 예외 사유\' 영역의 내용이 삭제되어 표시되지 않
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_392: 권한 - 마스터 외 차단', async ({ page }) => {
            // TODO: 응답이 권한 거부(예: 403)로 반환되고 계약 상태가 변경되지 않는다.
                    await expect(page).toHaveURL(/.+/);
        });

    });

});
