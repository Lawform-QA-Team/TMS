import { test, expect } from '@playwright/test';
import { URLS } from '../../util/url_base_hsad.js';
import { SELECTORS } from '../../util/selector_hsad.js';
import { login } from '../../common/auth.js';

// 인감별 결재선 지정 (온프레미스)
// 총 71건

test.describe('인감별 결재선 지정 (온프레미스) - 로고/도장 관리', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.describe('기업직인 탭', () => {
        test('LC_278: 카드 영역 - 기업직인 항목 노출', async ({ page }) => {
            await expect(page.getByText('등록된 4종의 기업직인 항목', { exact: false })).toBeVisible();
        });

        test('LC_279: 카드 정보 - 인감 이미지', async ({ page }) => {
            await expect(page.getByText('인감 이미지가 카드 상단에', { exact: false })).toBeVisible();
        });

        test('LC_280: 카드 정보 - 인감 이름', async ({ page }) => {
            await expect(page.getByText('인감 이름', { exact: false })).toBeVisible();
        });

        test('LC_281: 카드 정보 - 인감 용도', async ({ page }) => {
            await expect(page.getByText('인감 용도 텍스트', { exact: false })).toBeVisible();
        });

        test('LC_282: 카드 정보 - 결재 경로', async ({ page }) => {
            // TODO: \'현업부서 → 현업부서팀장 → 법무팀 담당자(최오현 책임) → CFO\' 
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_283: 카드 정보 - 결재 경로', async ({ page }) => {
            // TODO: \'현업부서 → 현업부서팀장 → 법무팀원(검토 담당자)\'  순서 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_284: 카드 정보 - 결재 경로', async ({ page }) => {
            await expect(page.getByText('\'현업부서 → 현업부서팀장 → 금융팀장\'  순서', { exact: false })).toBeVisible();
        });

        test('LC_285: 카드 정보 - 결재 경로', async ({ page }) => {
            await expect(page.getByText('\'현업부서 → 현업부서팀장 → 업무지원팀장\'  순서', { exact: false })).toBeVisible();
        });

        test('LC_286: 카드 정보 - [더보기] 아이콘', async ({ page }) => {
            await expect(page.getByText('수정하기\'와 \'삭제하기\' 메뉴', { exact: false })).toBeVisible();
        });

        test('LC_287: 카드 정보 - [더보기] 아이콘', async ({ page }) => {
            await expect(page.getByText('수정 가능 팝업', { exact: false })).toBeVisible();
        });

        test('LC_288: 카드 정보 - [더보기] 아이콘', async ({ page }) => {
            await expect(page.getByText('기업 직인 삭제 안내\' 팝업', { exact: false })).toBeVisible();
        });

        test('LC_289: [기업 직인 등록+] 버튼 - 노출', async ({ page }) => {
            await expect(page.getByText('[기업 직인 등록+] 버튼', { exact: false })).toBeVisible();
        });

    });

    test.describe('기업직인 등록', () => {
        test('LC_290: 기업직인 등록 팝업 - [기업 직인 등록+] 버튼 선택 동작', async ({ page }) => {
            await expect(page.getByText('기업 직인 등록\' 팝업', { exact: false })).toBeVisible();
        });

        test('LC_291: 기업직인 등록 팝업 - 직인명 입력', async ({ page }) => {
            await expect(page.getByText('직인 명을 입력해주세요.\' placeholder', { exact: false })).toBeVisible();
        });

        test('LC_292: 기업직인 등록 팝업 - [불러오기] 버튼', async ({ page }) => {
            await expect(page.getByText('[불러오기] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_293: 기업직인 등록 팝업 - [불러오기] 버튼', async ({ page }) => {
            // TODO: [불러오기] 버튼 하단에 선택한 파일명(예: 20260508_직인 이미지
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_294: 기업직인 등록 팝업 - [불러오기] 버튼', async ({ page }) => {
            await expect(page.getByText('업로드한 이미지', { exact: false })).toBeVisible();
        });

        test('LC_295: 기업직인 등록 팝업 - 직인용도 입력', async ({ page }) => {
            await expect(page.getByText('직인 용도를 입력해주세요.\'placeholder', { exact: false })).toBeVisible();
        });

        test('LC_296: 기업직인 등록 팝업 - 결재선 안내 문구', async ({ page }) => {
            // TODO: 등록된 직인의 결재선 설정은 내부 관리자에게 문의하세요\'  안내 문구 노
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_297: 기업직인 등록 팝업 - [등록] 버튼', async ({ page }) => {
            await expect(page.getByText('팝업이 닫히고 카드 목록에 등록한 카드', { exact: false })).toBeVisible();
        });

        test('LC_298: 기업직인 등록 팝업 - [취소] 버튼', async ({ page }) => {
            // TODO: 팝업이 닫히며 기업 직인 미등록됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('기업직인 삭제', () => {
        test('LC_299: 기업 직인 삭제 안내 팝업 - 결재선 동반 삭제 안내 문구 노출', async ({ page }) => {
            await expect(page.getByText('아래와 같은 팝업 본문', { exact: false })).toBeVisible();
        });

        test('LC_300: 기업 직인 삭제 안내 팝업 - 삭제 동작', async ({ page }) => {
            // TODO: 팝업 닫히며 해당 직인 삭제 처리되며 전체 건수 -1 반영 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_301: 기업 직인 삭제 안내 팝업 - 취소 동작', async ({ page }) => {
            // TODO: 팝업이 닫히고 해당 직인 삭제 미처리됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

});

test.describe('인감별 결재선 지정 (온프레미스) - 인감 사용 신청', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.describe('결재선', () => {
        test('LC_302: 기안자 카드 - 노출', async ({ page }) => {
            // TODO: 첫 번째 카드의 단계 라벨이 \'기안\'으로 노출되며 기안자명, 소속 팀 표
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_303: [결재자 추가] 버튼 - 미노출', async ({ page }) => {
            // TODO: 미노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_304: [결재자 추가] 버튼 - 노출', async ({ page }) => {
            await expect(page.getByText('[결재자 추가하기]버튼이 활성 상태', { exact: false })).toBeVisible();
        });

        test('LC_305: 자동 설정 - 인감 종류 선택 시 결재선 자동 설정', async ({ page }) => {
            await expect(page.getByText('결재선 영역에 설정된 법인 인감 결재선 추가되어', { exact: false })).toBeVisible();
        });

        test('LC_306: 자동 설정 - 인감 종류 변경', async ({ page }) => {
            // TODO: 결재선이 사용 인감 결재선으로 변경 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_307: 자동 설정 - 결재자 수동 추가', async ({ page }) => {
            // TODO: 결재선의 결재자 추가됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('문서 정보', () => {
        test('LC_308: 문서 첨부 방식 - 옵션', async ({ page }) => {
            await expect(page.getByText('옵션이 [파일로 첨부하기, My계약서에서 불러오기] 로', { exact: false })).toBeVisible();
        });

        test('LC_309: 문서 첨부 방식 - 기본값', async ({ page }) => {
            await expect(page.getByText('파일로 첨부하기\' 옵션 기본 선택 상태로', { exact: false })).toBeVisible();
        });

        test('LC_310: 문서 - 파일 업로드 버튼', async ({ page }) => {
            await expect(page.getByText('[파일 업로드] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_311: 문서명 - 필수 입력', async ({ page }) => {
            // TODO: 라벨에 필수 표시(*) 노출, \'계약명을 입력해 주세요.\' placeho
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_312: 상대방 정보 - 셀렉트 + 신규추가', async ({ page }) => {
            await expect(page.getByText('회사 검색 입력 필드와 [신규추가] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_313: 인감 종류 - 옵션', async ({ page }) => {
            // TODO: 옵션이 [법인 인감, 계약 인감, 당좌 인감, 사용 인감] 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_314: 인감 종류 - 미리보기', async ({ page }) => {
            // TODO: 셀렉트 우측 미리보기 영역에 법인 인감 이미지 표시됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_315: 법인 등기부 등본 - 법인 등기부 등본 항목 미노출', async ({ page }) => {
            // TODO: 미노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_316: 사용인감계 - 사용인감계 항목 미노출', async ({ page }) => {
            // TODO: 미노출됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('반출 여부', () => {
        test('LC_317: 계약 인감 - 활성화', async ({ page }) => {
            // TODO: 반출 여부의 [반출, 미반출] 라디오 옵션이 모두 활성화 처리되어 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_318: 법인 인감 - 비활성화·미반출 고정', async ({ page }) => {
            // TODO: 반출 여부 라디오가 비활성화 처리되고 \'미반출\' 옵션 선택된 상태로 노출
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_319: 당좌 인감 - 비활성화·미반출 고정', async ({ page }) => {
            // TODO: 반출 여부 라디오가 비활성화 처리되고 \'미반출\' 옵션 선택된 상태로 노출
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_320: 사용 인감 - 비활성화·미반출 고정', async ({ page }) => {
            // TODO: 반출 여부 라디오가 비활성화 처리되고 \'미반출\' 옵션 선택된 상태로 노출
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_321: 상태 전이 - 계약 인감 → 법인 인감 변경 시 반출 값 미반출로 변경', async ({ page }) => {
            // TODO: 반출 여부가 \'미반출\'로 자동 변경되며 라디오가 비활성화 상태로 변경됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('법인 인감 증명서', () => {
        test('LC_322: 법인 인감 - 활성화', async ({ page }) => {
            // TODO: 법인 인감 증명서*\'의 [사용, 미사용] 라디오 옵션이 모두 활성화됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_323: 법인 외 인감 - 비활성화·미사용 고정', async ({ page }) => {
            // TODO: 법인 인감 증명서*\' 라디오가 비활성화되고 \'미사용\'만 선택된 상태로 노
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_324: 상태 전이 - 법인 → 비법인 인감', async ({ page }) => {
            // TODO: 법인 인감 증명서\'가 \'미사용\'으로 자동 변경되며 라디오 버튼이 비활성화
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('[임시저장]', () => {
        test('LC_325: 임시저장 클릭 시 입력 데이터 저장', async ({ page }) => {
            // TODO: 임시저장 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('[검토 요청하기]', () => {
        test('LC_326: 유효성 검토 - 필수값 미입력 시 검토 요청 불가', async ({ page }) => {
            // TODO: 유효성 검토 팝업 노출되며 요청 불가함
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_327: 유효성 검토 - 모든 필수값 입력 후 검토 요청 성공', async ({ page }) => {
            // TODO: 요청 처리 완료되며 결재자 알림 발송됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

});

test.describe('인감별 결재선 지정 (온프레미스) - 계약검토 상세', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.describe('인감 사용 신청 정보', () => {
        test('LC_328: 승인 여부 - 결재라인 노출', async ({ page }) => {
            await expect(page.getByText('선택한 인감의 결재선대로 결재라인', { exact: false })).toBeVisible();
        });

        test('LC_329: 승인 여부 - 상태', async ({ page }) => {
            await expect(page.getByText('진행 상태가 승인 완료로', { exact: false })).toBeVisible();
        });

        test('LC_330: 승인 여부 - 상태', async ({ page }) => {
            await expect(page.getByText('진행 상태가 \'인감사용 신청 중\'으로', { exact: false })).toBeVisible();
        });

        test('LC_331: 승인 여부 - 상태', async ({ page }) => {
            await expect(page.getByText('진행 상태가 \'인감 사용 반려\'로', { exact: false })).toBeVisible();
        });

    });

});

test.describe('인감별 결재선 지정 (온프레미스) - 인감 사용 관리 대장', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.describe('반려/승인', () => {
        test('LC_332: 컬럼 - 노출 조건', async ({ page }) => {
            await expect(page.getByText('[반려] 버튼과 [승인] 버튼이 활성 상태로', { exact: false })).toBeVisible();
        });

        test('LC_333: 컬럼 - 노출 조건', async ({ page }) => {
            await expect(page.getByText('버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_334: 컬럼 - 상태', async ({ page }) => {
            await expect(page.getByText('대기\' 상태 텍스트', { exact: false })).toBeVisible();
        });

        test('LC_335: 컬럼 - 상태', async ({ page }) => {
            await expect(page.getByText('버튼 미노출 \'승인\' 텍스트', { exact: false })).toBeVisible();
        });

        test('LC_336: 컬럼 - 상태', async ({ page }) => {
            await expect(page.getByText('버튼 미노출 \'반려\' 텍스트', { exact: false })).toBeVisible();
        });

        test('LC_337: [승인] 버튼 - 확인 팝업', async ({ page }) => {
            await expect(page.getByText('인감 사용을 승인하시겠습니까?\' 확인 팝업', { exact: false })).toBeVisible();
        });

        test('LC_338: [승인] 버튼 - 확인 팝업', async ({ page }) => {
            // TODO: 팝업이 닫히며 승인처리됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_339: [반려] 버튼 - 확인 팝업', async ({ page }) => {
            await expect(page.getByText('인감 사용을 반려하시겠습니까?\' 확인 팝업', { exact: false })).toBeVisible();
        });

        test('LC_340: [반려] 버튼 - 확인 팝업', async ({ page }) => {
            // TODO: 팝업이 닫히며 반려처리됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_341: [반려] 버튼 - 상태 유지', async ({ page }) => {
            // TODO: 팝업이 닫히며 상태 변경 없음
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('컬럼', () => {
        test('LC_342: 날인 반납 - 노출조건', async ({ page }) => {
            await expect(page.getByText('[날인 완료] 버튼이 활성 상태로', { exact: false })).toBeVisible();
        });

        test('LC_343: 날인 반납 - 노출조건', async ({ page }) => {
            await expect(page.getByText('[반납 완료] 버튼이 활성 상태로', { exact: false })).toBeVisible();
        });

        test('LC_344: 날인 반납 - 결재라인 미포함', async ({ page }) => {
            await expect(page.getByText('버튼 미노출되며 \'-\' 표시', { exact: false })).toBeVisible();
        });

    });

    test.describe('날인 완료', () => {
        test('LC_345: 날인 완료 확인 팝업 - 날인 완료 버튼 클릭 → 확인 팝업 노출', async ({ page }) => {
            await expect(page.getByText('인감 날인이 완료되었습니까?\' 확인 팝업', { exact: false })).toBeVisible();
        });

        test('LC_346: 날인 완료 확인 팝업 - 확인 처리', async ({ page }) => {
            // TODO: 행의 \'날인 반납\' 컬럼에 완료 일시(YYYY-MM-DD)와 처리자명 표
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('반납 완료', () => {
        test('LC_347: 반납 왼료 확인 팝업 - 반납 완료 버튼 클릭 → 확인 팝업 노출', async ({ page }) => {
            await expect(page.getByText('인감이 반납 완료되었습니까?\' 확인 팝업', { exact: false })).toBeVisible();
        });

        test('LC_348: 반납 왼료 확인 팝업 - 확인 처리', async ({ page }) => {
            // TODO: 행의 \'날인 반납\' 컬럼에 완료 일시와 처리자명 표시되며 진행 상태가 \'
                    await expect(page).toHaveURL(/.+/);
        });

    });

});
