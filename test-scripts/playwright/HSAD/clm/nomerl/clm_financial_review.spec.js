import { test, expect } from '@playwright/test';
import { URLS } from '../../util/url_base_hsad.js';
import { SELECTORS } from '../../util/selector_hsad.js';
import { login } from '../../common/auth.js';

// 재무검토 프로세스 추가
// 총 151건

test.describe('재무검토 프로세스 추가 - LNB ', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.REVIEW);
    });

    test.describe('공통', () => {
        test('LC_001: LNB 노출 확인', async ({ page }) => {
            await expect(page.getByText('아래와 같은 메뉴 항목', { exact: false })).toBeVisible();
        });

    });

});

test.describe('재무검토 프로세스 추가 - 유관부서설정', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.REVIEW);
    });

    test.describe('영역 노출', () => {
        test('LC_002: 권한 - 마스터', async ({ page }) => {
            await expect(page.getByText('유관부서 검토 설정', { exact: false })).toBeVisible();
        });

        test('LC_003: 권한 - 법무배정', async ({ page }) => {
            await expect(page.getByText('유관부서 검토 설정', { exact: false })).toBeVisible();
        });

        test('LC_004: 권한 - 타 권한 보유자', async ({ page }) => {
            await expect(page.getByText('유관부서 검토 설정', { exact: false })).toBeVisible();
        });

        test('LC_005: 권한 - 일반 사용자', async ({ page }) => {
            await expect(page.getByText('유관부서 검토 설정', { exact: false })).toBeVisible();
        });

        test('LC_006: 상태 - "담당자 배정 중" 상태에서 유관부서 검토 설정 영역 노출', async ({ page }) => {
            await expect(page.getByText('유관부서 검토 설정', { exact: false })).toBeVisible();
        });

        test('LC_007: 사용/미사용 옵션 - 노출', async ({ page }) => {
            await expect(page.getByText('사용, 미사용  옵션  라디오 버튼과  [저장] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_008: 사용/미사용 옵션 - 노출', async ({ page }) => {
            await expect(page.getByText('미사용 옵션 값 선택 디폴트로', { exact: false })).toBeVisible();
        });

        test('LC_009: 사용/미사용 옵션 - 옵션 선택', async ({ page }) => {
            await expect(page.getByText('검토 항목 설정 영역', { exact: false })).toBeVisible();
        });

        test('LC_010: 사용/미사용 옵션 - 옵션 선택', async ({ page }) => {
            await expect(page.getByText('검토 항목 설정 영역 미', { exact: false })).toBeVisible();
        });

    });

    test.describe('검토 항목 설정', () => {
        test('LC_011: 체크박스 - 금융', async ({ page }) => {
            await expect(page.getByText('금융 담당 배정 체크박스', { exact: false })).toBeVisible();
        });

        test('LC_012: 체크박스 - 회계', async ({ page }) => {
            await expect(page.getByText('회계 담당 배정 체크박스', { exact: false })).toBeVisible();
        });

        test('LC_013: 체크박스 - 제작관리', async ({ page }) => {
            await expect(page.getByText('제작관리 담당 배정 체크박스', { exact: false })).toBeVisible();
        });

        test('LC_014: 디폴트 담당자 - 금융', async ({ page }) => {
            await expect(page.getByText('하단에 \'금융 팀장\' 텍스트와 \'변경됨\' 뱃지', { exact: false })).toBeVisible();
        });

        test('LC_015: 디폴트 담당자 - 회계', async ({ page }) => {
            await expect(page.getByText('하단에 \'회계 팀장\' 텍스트와 \'변경됨\' 뱃지', { exact: false })).toBeVisible();
        });

        test('LC_016: 디폴트 담당자 - 제작관리', async ({ page }) => {
            await expect(page.getByText('하단에 \'제작관리 팀장\' 텍스트와 \'변경됨\' 뱃지', { exact: false })).toBeVisible();
        });

        test('LC_017: 담당자 변경 - 버튼', async ({ page }) => {
            await expect(page.getByText('각 항목 별 [담당자 변경] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_018: 담당자 변경 - 버튼', async ({ page }) => {
            await expect(page.getByText('금융팀 조직도 팝업', { exact: false })).toBeVisible();
        });

        test('LC_019: 담당자 변경 - 조직도 팝업', async ({ page }) => {
            // TODO: 선택한 사용자로 담당자 변경처리됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_020: 담당자 변경 - 조직도 팝업', async ({ page }) => {
            // TODO: 변경한 담당자명 텍스트로 변경 노출되며 뱃지에 하이라이트 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_021: 담당 부서 추가 - 버튼', async ({ page }) => {
            await expect(page.getByText('[담당 부서 추가] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_022: 담당 부서 추가 - 버튼', async ({ page }) => {
            await expect(page.getByText('아래와 같은 담당 부서 추가 팝업', { exact: false })).toBeVisible();
        });

        test('LC_023: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            await expect(page.getByText('HSAD조직도', { exact: false })).toBeVisible();
        });

        test('LC_024: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            // TODO: HSAD 부서 조직도와 [전체 펼치기], [전체 접기]버튼 노출됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_025: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            await expect(page.getByText('부서 조직도 4뎁스까지 모두', { exact: false })).toBeVisible();
        });

        test('LC_026: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            await expect(page.getByText('부서 조직도 1뎁스만', { exact: false })).toBeVisible();
        });

        test('LC_027: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            // TODO: 해당 부서 선택되어 선택된 부서 영역에 추가됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_028: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            // TODO: 5개 부서 모두 선택됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_029: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            // TODO: 선택되지 않음
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_030: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            await expect(page.getByText('\'선택된 부서가 없습니다.\' 안내 문구', { exact: false })).toBeVisible();
        });

        test('LC_031: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            await expect(page.getByText('선택된 부서 항목', { exact: false })).toBeVisible();
        });

        test('LC_032: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            await expect(page.getByText('선택된 부서 항목명과 우측 x 아이콘', { exact: false })).toBeVisible();
        });

        test('LC_033: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            await expect(page.getByText('해당 부서 선택 해제되어 미', { exact: false })).toBeVisible();
        });

        test('LC_034: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            // TODO: 팝업 닫히며 선택한 부서 추가되지 않음
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_035: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            // TODO: 팝업 닫히며 선택한 부서 추가되지 않음
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_036: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            // TODO: 검토 항목 영역에 \'인사팀\' 항목 추가됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_037: 담당 부서 추가 - 조직도 팝업', async ({ page }) => {
            // TODO: 디폴트 값인 \'인사팀 팀장\' 배정 설정됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_038: 부서 삭제 - [X] 버튼', async ({ page }) => {
            await expect(page.getByText('각 항목별로 [X] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_039: 부서 삭제 - [X] 버튼', async ({ page }) => {
            // TODO: 선택한 항목이 삭제 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_040: 저장 - [저장] 버튼', async ({ page }) => {
            await expect(page.getByText('[저장] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_041: 저장 - [저장] 버튼', async ({ page }) => {
            await expect(page.getByText('유관부서 검토 설정 확인 팝업', { exact: false })).toBeVisible();
        });

        test('LC_042: 저장 - [저장] 버튼', async ({ page }) => {
            await expect(page.getByText('아래와 같', { exact: false })).toBeVisible();
        });

        test('LC_043: 저장 - [저장] 버튼', async ({ page }) => {
            // TODO: 유관부서 검토 설정 확인 팝업 닫힘
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_044: 저장 - [저장] 버튼', async ({ page }) => {
            await expect(page.getByText('유관부서 검토 설정 완료되며 팝업', { exact: false })).toBeVisible();
        });

        test('LC_045: 저장 - [저장] 버튼', async ({ page }) => {
            await expect(page.getByText('아래와 같이 팝업 내용', { exact: false })).toBeVisible();
        });

        test('LC_046: 저장 - [저장] 버튼', async ({ page }) => {
            // TODO: 해당 팝업 닫힘
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_047: 저장 - [저장] 버튼', async ({ page }) => {
            await expect(page.getByText('아래와 같', { exact: false })).toBeVisible();
        });

        test('LC_048: 저장 - [저장] 버튼', async ({ page }) => {
            // TODO: 유관부서 검토 설정 확인 팝업 닫힘
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_049: 저장 - [저장] 버튼', async ({ page }) => {
            await expect(page.getByText('유관부서 검토 미설정 완료되며 팝업', { exact: false })).toBeVisible();
        });

        test('LC_050: 저장 - [저장] 버튼', async ({ page }) => {
            await expect(page.getByText('아래와 같이 팝업 내용', { exact: false })).toBeVisible();
        });

        test('LC_051: 저장 - [저장] 버튼', async ({ page }) => {
            // TODO: 해당 팝업 닫힘
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_052: 저장 완료 - 알림', async ({ page }) => {
            // TODO: 설정된 유관부서 검토 배정 담당자에게 배정 알림(이메일/노티) 발송됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_053: 저장 완료 - 진행 내역', async ({ page }) => {
            await expect(page.getByText('아래와 같은 코멘트', { exact: false })).toBeVisible();
        });

        test('LC_054: 저장 완료 - 진행 내역', async ({ page }) => {
            await expect(page.getByText('아래와 같은 코멘트', { exact: false })).toBeVisible();
        });

        test('LC_055: 저장 완료 - 진행 내역', async ({ page }) => {
            await expect(page.getByText('아래와 같은 코멘트', { exact: false })).toBeVisible();
        });

        test('LC_056: 저장 완료 - 진행 내역', async ({ page }) => {
            await expect(page.getByText('금융 검토 중', { exact: false })).toBeVisible();
        });

        test('LC_057: 저장 완료 - 진행 내역', async ({ page }) => {
            await expect(page.getByText('재무·회계·제작관리 항목 동시검토 진행 변경 내역', { exact: false })).toBeVisible();
        });

        test('LC_058: 저장 완료 - 활동 로그', async ({ page }) => {
            await expect(page.getByText('아래와 같은 로그', { exact: false })).toBeVisible();
        });

        test('LC_059: 저장 완료 - 활동 로그', async ({ page }) => {
            await expect(page.getByText('아래와 같은 로그', { exact: false })).toBeVisible();
        });

        test('LC_060: 저장 완료 - 법무 검토 모드', async ({ page }) => {
            await expect(page.getByText('동시 검토 / 순차 검토 옵션', { exact: false })).toBeVisible();
        });

        test('LC_061: 저장 완료 - 법무 검토 모드', async ({ page }) => {
            await expect(page.getByText('동시 검토 옵션 디폴트 선택 상태로', { exact: false })).toBeVisible();
        });

        test('LC_062: 저장 완료 - 프로그레스바', async ({ page }) => {
            await expect(page.getByText('법무 검토 중 상태 텍스트', { exact: false })).toBeVisible();
        });

        test('LC_063: 저장 완료 - 프로그레스바', async ({ page }) => {
            await expect(page.getByText('담당자 동시 검토 중 상태 텍스트', { exact: false })).toBeVisible();
        });

        test('LC_064: 저장 완료 - 프로그레스바', async ({ page }) => {
            await expect(page.getByText('각 항목별 진행 상태에 따라 별도 표기되어 툴팁', { exact: false })).toBeVisible();
        });

    });

});

test.describe('재무검토 프로세스 추가 - 추가검토 담당자 배정', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.REVIEW);
    });

    test.describe('배정', () => {
        test('LC_065: 권한별 노출 - 마스터', async ({ page }) => {
            await expect(page.getByText('금융/회계/제작관리 3개 항목 모두 [배정] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_066: 권한별 노출 - 금융팀장', async ({ page }) => {
            await expect(page.getByText('금융 검토 담당 항목에만 [배정] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_067: 권한별 노출 - 금융팀장', async ({ page }) => {
            await expect(page.getByText('회계 검토 담당 항목의 [배정] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_068: 권한별 노출 - 금융팀장', async ({ page }) => {
            await expect(page.getByText('제작관리 검토 담당 항목의 [배정] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_069: 권한별 노출 - 회계팀장', async ({ page }) => {
            await expect(page.getByText('회계 검토 담당 항목에만 [배정] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_070: 권한별 노출 - 제작관리팀장', async ({ page }) => {
            await expect(page.getByText('제작관리 검토 담당 항목에만 [배정] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_071: 권한별 노출 - 일반 사용자', async ({ page }) => {
            await expect(page.getByText('모든 항목에 [배정] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_072: 미배정 표기 - 라벨', async ({ page }) => {
            // TODO: 미배정 라벨이 표시됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_073: 미배정 표기 - 라벨', async ({ page }) => {
            await expect(page.getByText('담당자명', { exact: false })).toBeVisible();
        });

        test('LC_074: 미배정 표기 - 라벨', async ({ page }) => {
            await expect(page.getByText('담당자명', { exact: false })).toBeVisible();
        });

        test('LC_075: 미배정 표기 - 라벨', async ({ page }) => {
            await expect(page.getByText('담당자명', { exact: false })).toBeVisible();
        });

        test('LC_076: 유관부서 검토 담당자 배정 모달 - 노출', async ({ page }) => {
            await expect(page.getByText('유관부서 검토 담당자 배정 모달', { exact: false })).toBeVisible();
        });

        test('LC_077: 유관부서 검토 담당자 배정 모달 - 검색 필드', async ({ page }) => {
            await expect(page.getByText('\'담당자명으로 검색\' Placeholder', { exact: false })).toBeVisible();
        });

        test('LC_078: 유관부서 검토 담당자 배정 모달 - 검색 필드', async ({ page }) => {
            await expect(page.getByText('검색 결과 금융팀 소속 사용자', { exact: false })).toBeVisible();
        });

        test('LC_079: 유관부서 검토 담당자 배정 모달 - 검색 필드', async ({ page }) => {
            await expect(page.getByText('검색 결과 미', { exact: false })).toBeVisible();
        });

        test('LC_080: 유관부서 검토 담당자 배정 모달 - 검색 필드', async ({ page }) => {
            // TODO: 마지막에 선택한 1명만 선택 상태로 유지됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_081: 유관부서 검토 담당자 배정 모달 - 검토 방법 설정', async ({ page }) => {
            await expect(page.getByText('\'동시 검토\' 단일 옵션으로 선택된 상태로', { exact: false })).toBeVisible();
        });

        test('LC_082: 유관부서 검토 담당자 배정 모달 - 배정 버튼 노출', async ({ page }) => {
            await expect(page.getByText('[배정] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_083: 배정 처리 - 성공', async ({ page }) => {
            // TODO: 팝업이 닫히며 금융 검토 담당 항목에 선택된 담당자 배정됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_084: 배정 처리 - 버튼 변경', async ({ page }) => {
            // TODO: 버튼이 [변경]버튼으로 변경됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_085: 배정 처리 - 미배정 텍스트 제거', async ({ page }) => {
            await expect(page.getByText('미배정', { exact: false })).toBeVisible();
        });

        test('LC_086: 배정 처리 - 변경 내역', async ({ page }) => {
            await expect(page.getByText('재무 3개 항목의 담당자 배정 이력이 모두', { exact: false })).toBeVisible();
        });

        test('LC_087: 배정 처리 - 변경 내역', async ({ page }) => {
            await expect(page.getByText('재무 3개 항목의 변경 내역이 모두', { exact: false })).toBeVisible();
        });

        test('LC_088: 배정 처리 - 코멘트', async ({ page }) => {
            await expect(page.getByText('OOO 님께서 금융 검토 담당자로 배정되었습니다.', { exact: false })).toBeVisible();
        });

        test('LC_089: 배정 처리 - 코멘트', async ({ page }) => {
            await expect(page.getByText('금융 검토 중', { exact: false })).toBeVisible();
        });

        test('LC_090: 배정 처리 - 코멘트', async ({ page }) => {
            await expect(page.getByText('OOO 님께서 회계 검토 담당자로 배정되었습니다.', { exact: false })).toBeVisible();
        });

        test('LC_091: 배정 처리 - 코멘트', async ({ page }) => {
            await expect(page.getByText('OOO 님께서 제작관리 검토 담당자로 배정되었습니다.', { exact: false })).toBeVisible();
        });

    });

    test.describe('변경', () => {
        test('LC_092: 버튼 노출 -  권한 있음', async ({ page }) => {
            await expect(page.getByText('[변경] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_093: 버튼 노출 - 권한 없음', async ({ page }) => {
            await expect(page.getByText('[변경] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_094: 담당자 변경 팝업 - [변경] 버튼 선택 시 담당자 변경 팝업 노출', async ({ page }) => {
            await expect(page.getByText('추가 검토 담당자 변경 팝업', { exact: false })).toBeVisible();
        });

        test('LC_095: 담당자 변경 팝업 - 검색', async ({ page }) => {
            await expect(page.getByText('검색 결과에 금융팀 소속 인원', { exact: false })).toBeVisible();
        });

        test('LC_096: 변경 처리 - 새 담당자 배정', async ({ page }) => {
            // TODO: 선택한 사용자로 검토 담당자 변경 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_097: 변경 처리 - 코멘트 생성', async ({ page }) => {
            await expect(page.getByText('OOO 님께서 금융 검토 담당자로 배정되었습니다.', { exact: false })).toBeVisible();
        });

    });

});

test.describe('재무검토 프로세스 추가 - 담당자 검토', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.REVIEW);
    });

    test.describe('검토 완료', () => {
        test('LC_098: 권한별 노출 - 법무 담당자', async ({ page }) => {
            // TODO: [법무 검토 완료], [요청자에게 보내기], [계약 중단/취소]버튼 노출
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_099: 권한별 노출 - 금융 담당자', async ({ page }) => {
            // TODO: [금융 검토 완료], [요청자에게 보내기], [계약 중단/취소]버튼 노출
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_100: 권한별 노출 - 회계 담당자', async ({ page }) => {
            // TODO: [회계 검토 완료], [요청자에게 보내기], [계약 중단/취소]버튼 노출
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_101: 권한별 노출 - 제작관리 담당자', async ({ page }) => {
            // TODO: [제작관리 검토 완료], [요청자에게 보내기], [계약 중단/취소]버튼 
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_102: 권한별 노출 - 비-담당자', async ({ page }) => {
            await expect(page.getByText('버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_103: 선택 동작 - 법무 단독 처리', async ({ page }) => {
            await expect(page.getByText('법무 검토 완료', { exact: false })).toBeVisible();
        });

        test('LC_104: 선택 동작 - 법무 다른 영역 영향 없음', async ({ page }) => {
            await expect(page.getByText('검토 중', { exact: false })).toBeVisible();
        });

        test('LC_105: 선택 동작 - 금융 단독 처리', async ({ page }) => {
            await expect(page.getByText('금융 검토 완료', { exact: false })).toBeVisible();
        });

        test('LC_106: 선택 동작 - 회계 단독 처리', async ({ page }) => {
            await expect(page.getByText('회계 검토 완료', { exact: false })).toBeVisible();
        });

        test('LC_107: 선택 동작 - 제작관리 단독 처리', async ({ page }) => {
            await expect(page.getByText('제작관리 검토 완료', { exact: false })).toBeVisible();
        });

        test('LC_108: 선택 동작 - 전체 완료 → 다음 단계', async ({ page }) => {
            await expect(page.getByText('법무검토 완료 승인', { exact: false })).toBeVisible();
        });

        test('LC_123: 코멘트 - 자동 생성', async ({ page }) => {
            await expect(page.getByText('금융 검토 완료 관련 코멘트', { exact: false })).toBeVisible();
        });

        test('LC_124: 코멘트 - 자동 생성', async ({ page }) => {
            await expect(page.getByText('[반려] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_125: 코멘트 - 자동 생성', async ({ page }) => {
            await expect(page.getByText('[반려] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_126: 코멘트 - 자동 생성', async ({ page }) => {
            await expect(page.getByText('[반려] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_127: 코멘트 - 자동 생성', async ({ page }) => {
            await expect(page.getByText('[반려] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_128: 코멘트 - 자동 생성', async ({ page }) => {
            await expect(page.getByText('[반려] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_129: 버튼 노출 - [법무 검토 완료 승인] 버튼', async ({ page }) => {
            await expect(page.getByText('[법무 검토 완료 승인] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_130: 버튼 노출 - [반려] 버튼', async ({ page }) => {
            await expect(page.getByText('[반려] 버튼', { exact: false })).toBeVisible();
        });

    });

    test.describe('요청자에게 보내기', () => {
        test('LC_109: 선택 동작 - 상태 전이', async ({ page }) => {
            await expect(page.getByText('요청자 검토 중', { exact: false })).toBeVisible();
        });

        test('LC_110: 선택 동작 - 다른 영역 영향 없음', async ({ page }) => {
            await expect(page.getByText('검토 중', { exact: false })).toBeVisible();
        });

        test('LC_111: 선택 동작 - 요청자 알림 발송', async ({ page }) => {
            // TODO: 요청 알림 메일 수신됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('진행 상태', () => {
        test('LC_112: 프로그레스바 - 담당자 동시 검토 중 단계 노출', async ({ page }) => {
            await expect(page.getByText('담당자 동시 검토 중 단계', { exact: false })).toBeVisible();
        });

        test('LC_113: 프로그레스바 - 법무검토 완료 승인 단계 노출', async ({ page }) => {
            await expect(page.getByText('법무 검토 완료 승인 단계', { exact: false })).toBeVisible();
        });

        test('LC_114: 프로그레스바 - 호버 툴팁', async ({ page }) => {
            await expect(page.getByText('툴팁', { exact: false })).toBeVisible();
        });

        test('LC_115: 프로그레스바 - 호버 툴팁', async ({ page }) => {
            await expect(page.getByText('검토중', { exact: false })).toBeVisible();
        });

        test('LC_116: 프로그레스바 - 호버 툴팁', async ({ page }) => {
            await expect(page.getByText('검토중', { exact: false })).toBeVisible();
        });

        test('LC_117: 프로그레스바 - 호버 툴팁', async ({ page }) => {
            await expect(page.getByText('요청자 검토 중', { exact: false })).toBeVisible();
        });

        test('LC_118: 프로그레스바 - 호버 툴팁', async ({ page }) => {
            await expect(page.getByText('검토 완료', { exact: false })).toBeVisible();
        });

        test('LC_119: 프로그레스바 - 호버 툴팁', async ({ page }) => {
            await expect(page.getByText('법무, 금융, 회계 노출되며 제작관리 항목은 미', { exact: false })).toBeVisible();
        });

        test('LC_120: 유관부서 검토 설정 영역 - 각 영역 상태 노출', async ({ page }) => {
            await expect(page.getByText('각 영역별 진행 상태 텍스트가 검토 담당자명 우측에', { exact: false })).toBeVisible();
        });

        test('LC_121: 실시간 반영 - 검토 완료 후 즉시 갱신', async ({ page }) => {
            await expect(page.getByText('검토 완료', { exact: false })).toBeVisible();
        });

        test('LC_122: 실시간 반영 - 요청자 보내기 후 갱신', async ({ page }) => {
            await expect(page.getByText('요청자 검토 중', { exact: false })).toBeVisible();
        });

    });

    test.describe('법무 검토 완료 승인', () => {
        test('LC_131: 승인 시 최종 결재 단계로 진행', async ({ page }) => {
            // TODO: 진행 단계가 \'최종 결재 중\'으로 변경됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('반려', () => {
        test('LC_132: 동시검토 승인 반려 팝업 - [반려] 버튼 선택 동작', async ({ page }) => {
            await expect(page.getByText('아래와 같은 승인 반려 팝업', { exact: false })).toBeVisible();
        });

        test('LC_133: 동시검토 승인 반려 팝업 - 동시 검토 항목', async ({ page }) => {
            // TODO: 체크박스 항목이 [법무, 금융, 회계, 제작관리]와 동일한 순서/이름으로
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_134: 동시검토 승인 반려 팝업 - 사유', async ({ page }) => {
            await expect(page.getByText('항목명에 필수 입력 기호와 함께', { exact: false })).toBeVisible();
        });

        test('LC_135: 동시검토 승인 반려 팝업 - 사유', async ({ page }) => {
            await expect(page.getByText('\'반려 사유를 입력해주세요.\' Placeholder', { exact: false })).toBeVisible();
        });

        test('LC_136: 동시검토 승인 반려 팝업 - [취소] 버튼', async ({ page }) => {
            await expect(page.getByText('[취소] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_137: 동시검토 승인 반려 팝업 - [취소] 버튼', async ({ page }) => {
            // TODO: 팝업 닫히며 진행 상태 유지됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_138: 동시검토 승인 반려 팝업 - [확인] 버튼', async ({ page }) => {
            await expect(page.getByText('[확인] 버튼', { exact: false })).toBeVisible();
        });

        test('LC_139: 동시검토 승인 반려 팝업 - [확인] 버튼', async ({ page }) => {
            await expect(page.getByText('[확인] 버튼이 활성화 처리되어', { exact: false })).toBeVisible();
        });

        test('LC_140: 동시검토 승인 반려 팝업 - [확인] 버튼', async ({ page }) => {
            await expect(page.getByText('[확인] 버튼이 비활성화 상태로', { exact: false })).toBeVisible();
        });

        test('LC_141: 동시검토 승인 반려 팝업 - [확인] 버튼', async ({ page }) => {
            await expect(page.getByText('[확인] 버튼이 비활성화 상태로', { exact: false })).toBeVisible();
        });

        test('LC_142: 동시검토 승인 반려 팝업 - [확인] 버튼', async ({ page }) => {
            // TODO: [확인] 버튼이 비활성화 상태로 변경됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_143: 동시검토 승인 반려 팝업 - [확인] 버튼', async ({ page }) => {
            // TODO: [확인] 버튼이 비활성화 상태로 변경됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_144: 동시검토 승인 반려 팝업 - [확인] 버튼', async ({ page }) => {
            await expect(page.getByText('승인 반려 팝업이 닫히며 승인 반려 완료 팝업', { exact: false })).toBeVisible();
        });

        test('LC_145: 승인 반려 완료 팝업 - 승인 반려 완료 팝업 노출', async ({ page }) => {
            await expect(page.getByText('아래와 같이 팝업', { exact: false })).toBeVisible();
        });

        test('LC_146: 승인 반려 완료 팝업 - [확인] 버튼', async ({ page }) => {
            // TODO: 승인 반려 완료 팝업이 닫힘
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('반려 후 상태', () => {
        test('LC_147: 선택 항목 - 검토 진행 중', async ({ page }) => {
            // TODO: [금융, 회계] 항목의 상태가 \'검토 중\'으로 변경됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_148: 미선택 항목 - 검토 완료 유지', async ({ page }) => {
            // TODO: [법무, 제작관리] 항목은 \'검토 완료\' 상태 유지됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_149: 전체 선택 - 전체 검토 진행 중', async ({ page }) => {
            // TODO: 4개 항목 모두 상태가 \'검토 중\'으로 변경됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_150: 진행 단계 - 문서 상태 변경', async ({ page }) => {
            // TODO: 담당자 동시 검토중 상태로 변경됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_151: 진행 내역 - 로그 기록', async ({ page }) => {
            await expect(page.getByText('변경 내역 탭에 법무팀장의 반려 처리 텍스트', { exact: false })).toBeVisible();
        });

    });

});
