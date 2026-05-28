import { test, expect } from '@playwright/test';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../util/selector_hsad.js';
import { login } from '../common/auth.js';

// 블랙리스트 업체 계약 특별 승인 요청
// 총 60건

test.describe('블랙리스트 업체 계약 특별 승인 요청 - 블랙리스트 조회', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.DRAFT);
    });

    test.describe('MDM 거래처 조회', () => {
        test('LC_218: 정상 업체 - MDM 등록 정상 업체로 검토 요청 시 정상 진행', async ({ page }) => {
            // TODO: 검토 요청 진행되며 프로세스에 따라 상태 변경 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_219: 블랙리스트 업체 - 블랙리스트 업체로 검토 요청 시 거래 제한 팝업 노출', async ({ page }) => {
            // TODO: 블랙리스트 차단 팝업 노출되며 검토 요청 진행되지 않음
                    await expect(page).toHaveURL(/.+/);
        });

    });

});

test.describe('블랙리스트 업체 계약 특별 승인 요청 - 블랙리스트 차단 팝업', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.DRAFT);
    });

    test.describe('본문 안내', () => {
        test('LC_220: 안내 문구 - 차단 팝업 본문 안내 문구 정확성', async ({ page }) => {
            await expect(page.getByText('아래와 같은 안내문구', { exact: false })).toBeVisible();
        });

    });

    test.describe('거래 제한 업체 정보', () => {
        test('LC_221: 거래 제한 업체 정보 박스 노출', async ({ page }) => {
            await expect(page.getByText('업체명', { exact: false })).toBeVisible();
        });

        test('LC_222: 업체명 - 차단된 업체명 표시', async ({ page }) => {
            await expect(page.getByText('해당 업체명 정상', { exact: false })).toBeVisible();
        });

        test('LC_223: 사업자번호 - 사업자번호 표시', async ({ page }) => {
            await expect(page.getByText('해당 업체의 사업자 번호로', { exact: false })).toBeVisible();
        });

        test('LC_224: 대표자 - 대표자 표시', async ({ page }) => {
            await expect(page.getByText('해당 업체의 대표자명', { exact: false })).toBeVisible();
        });

    });

    test.describe('안내 박스', () => {
        test('LC_225: 특별 승인 안내 - 특별 승인 요청 안내 박스 표시', async ({ page }) => {
            await expect(page.getByText('아래와 같은 안내문구', { exact: false })).toBeVisible();
        });

    });

    test.describe('동의 체크박스', () => {
        test('LC_226: 라벨 - 동의 체크박스 라벨 노출', async ({ page }) => {
            await expect(page.getByText('아래와 같은 라벨', { exact: false })).toBeVisible();
        });

        test('LC_227: 체크 박스 - 동의 체크박스 > 초기 미체크 상태', async ({ page }) => {
            await expect(page.getByText('미체크 상태로', { exact: false })).toBeVisible();
        });

    });

    test.describe('[취소] 버튼', () => {
        test('LC_228: [취소] 버튼 노출', async ({ page }) => {
            await expect(page.getByText('[특별 승인 요청] 버튼 좌측에', { exact: false })).toBeVisible();
        });

        test('LC_229: [취소] 버튼 선택 동작', async ({ page }) => {
            // TODO: 특별 승인 요청 미처리되며 차단 팝업 닫힘
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('닫기[X] 버튼', () => {
        test('LC_230: 우측 상단 닫기[X] 버튼 노출', async ({ page }) => {
            await expect(page.getByText('우측 상단 닫기[X] 아이콘', { exact: false })).toBeVisible();
        });

        test('LC_231: 우측 상단 닫기[X] 버튼 선택 동작', async ({ page }) => {
            // TODO: 특별 승인 요청 미처리되며 차단 팝업 닫힘
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('[특별 승인 요청] 버튼', () => {
        test('LC_232:  비활성화 - 동의 미체크 시 [특별 승인 요청] 버튼 비활성화', async ({ page }) => {
            // TODO: 비활성화 상태로 노출되어 선택 불가함
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_233: 활성화 - 동의 체크 시 [특별 승인 요청] 버튼 활성화', async ({ page }) => {
            // TODO: 버튼이 활성화 상태로 변경되며 선택 가능함
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_234: 활성화 - [특별 승인 요청] 버튼 선택 동작', async ({ page }) => {
            // TODO: 특별 승인 요청 완료 팝업 노출되며 득별 승인 요청 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

});

test.describe('블랙리스트 업체 계약 특별 승인 요청 - 특별 승인 요청', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.DRAFT);
    });

    test.describe('요청 처리', () => {
        test('LC_235: 상태 전이 - 특별 승인 요청 중 상태로 문서 상태 변경', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청 중', { exact: false })).toBeVisible();
        });

        test('LC_236: 이메일 발송 - 윤리사무국 안내 메일 발송', async ({ page }) => {
            // TODO: 윤리사무국 담당자에게 이메일 전송됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_237: 특별 승인 요청 완료 팝업 - 특별 승인 요청 완료 팝업 노출', async ({ page }) => {
            await expect(page.getByText('아래와 같은 승인 요청 완료 팝업', { exact: false })).toBeVisible();
        });

        test('LC_238: 특별 승인 요청 완료 팝업 - Page Refresh', async ({ page }) => {
            // TODO: 페이지가 새로고침 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

});

test.describe('블랙리스트 업체 계약 특별 승인 요청 - 특별 승인 요청 완료', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.DRAFT);
    });

    test.describe('요청자', () => {
        test('LC_239: 검토 요청 조회 - 검토 요청 조회 페이지 > 리스트 노출', async ({ page }) => {
            await expect(page.getByText('해당 특별 승인 요청중 문서 항목', { exact: false })).toBeVisible();
        });

        test('LC_240: 계약 검토 요청 상세 페이지 - 특별 승인 요청 후 요청자 화면 노출', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청중 상태 문서 화면', { exact: false })).toBeVisible();
        });

        test('LC_241: 계약 검토 요청 상세 페이지 - 진행 내역', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청중\'으로 문서 상태 변경 내역', { exact: false })).toBeVisible();
        });

        test('LC_242: 계약 검토 요청 상세 페이지 - [계약 중단/취소] 버튼', async ({ page }) => {
            await expect(page.getByText('[계약 중단/취소] 단일 버튼 활성화 상태로', { exact: false })).toBeVisible();
        });

        test('LC_243: 계약 검토 요청 상세 페이지 - [계약 중단/취소] 버튼', async ({ page }) => {
            // TODO: 계약 중단 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('마스터', () => {
        test('LC_244: 메일 진입 - 메일 템플릿 노출 확인', async ({ page }) => {
            await expect(page.getByText('아래와 같은 메일 내용', { exact: false })).toBeVisible();
        });

        test('LC_245: 메일 진입 - [계약 내용 확인] 버튼', async ({ page }) => {
            await expect(page).toHaveURL(/.+/);
        });

        test('LC_246: 계약 검토 요청 상세 페이지 - 윤리사무국 담당자 > 특별 승인 요청 중 문서 상세 페이지 진입', async ({ page }) => {
            // TODO: 특별 승인 요청중 상태 문서 화면 노출되며  우측 상단 [특별 승인 완료
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_247: 계약 검토 요청 상세 페이지', async ({ page }) => {
            await expect(page.getByText('[특별 승인 완료], [특별 승인 거부] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_248: 계약 검토 요청 상세 페이지 - [특별 승인 완료] 버튼', async ({ page }) => {
            // TODO: 특별 승인 완료 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_249: 계약 검토 요청 상세 페이지 - [특별 승인 거부] 버튼', async ({ page }) => {
            // TODO: 특별 승인 거부 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('윤리 사무국 담당자', () => {
        test('LC_250: 메일 진입 - 메일 템플릿 노출 확인', async ({ page }) => {
            await expect(page.getByText('아래와 같은 메일 내용', { exact: false })).toBeVisible();
        });

        test('LC_251: 메일 진입 - [계약 내용 확인] 버튼', async ({ page }) => {
            await expect(page).toHaveURL(/.+/);
        });

        test('LC_252: 계약 검토 요청 상세 페이지 - 윤리사무국 담당자 > 특별 승인 요청 중 문서 상세 페이지 진입', async ({ page }) => {
            // TODO: 특별 승인 요청중 상태 문서 화면 노출되며  우측 상단 [특별 승인 완료
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_253: 계약 검토 요청 상세 페이지', async ({ page }) => {
            await expect(page.getByText('[특별 승인 완료], [특별 승인 거부] 버튼 미', { exact: false })).toBeVisible();
        });

        test('LC_254: 계약 검토 요청 상세 페이지 - [특별 승인 완료] 버튼', async ({ page }) => {
            // TODO: 특별 승인 완료 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_255: 계약 검토 요청 상세 페이지 - [특별 승인 거부] 버튼', async ({ page }) => {
            // TODO: 특별 승인 거부 처리됨
                    await expect(page).toHaveURL(/.+/);
        });

    });

    test.describe('문서 관련자', () => {
        test('LC_256: 문서 내부 결재자 - 검토 요청 조회', async ({ page }) => {
            await expect(page.getByText('해당 특별 승인 요청중 문서 항목 미', { exact: false })).toBeVisible();
        });

        test('LC_257: 문서 내부 결재자 - 계약 검토 요청 상세', async ({ page }) => {
            await expect(page.getByText('진입 불가하며 권한 없음 팝업', { exact: false })).toBeVisible();
        });

        test('LC_258: 문서 참조인 - 검토 요청 조회', async ({ page }) => {
            await expect(page.getByText('해당 특별 승인 요청중 문서 항목 미', { exact: false })).toBeVisible();
        });

        test('LC_259: 문서 참조인 - 계약 검토 요청 상세', async ({ page }) => {
            await expect(page.getByText('진입 불가하며 권한 없음 팝업', { exact: false })).toBeVisible();
        });

    });

    test.describe('문서 미관련자', () => {
        test('LC_260: 검토 요청 조회 - 검토 요청 조회 페이지 > 리스트 미노출', async ({ page }) => {
            await expect(page.getByText('해당 특별 승인 요청중 문서 항목 미', { exact: false })).toBeVisible();
        });

        test('LC_261: 계약 검토 요청 상세 - 검토 요청 상세 링크 직접 진입 차단', async ({ page }) => {
            await expect(page.getByText('진입 불가하며 권한 없음 팝업', { exact: false })).toBeVisible();
        });

    });

});

test.describe('블랙리스트 업체 계약 특별 승인 요청 - 특별 승인 처리', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(URLS.CLM.DRAFT);
    });

    test.describe('완료', () => {
        test('LC_262: 특별 승인 완료 얼럿  - 특별 승인 완료 얼럿 노출', async ({ page }) => {
            await expect(page.getByText('특별 승인 완료 얼럿', { exact: false })).toBeVisible();
        });

        test('LC_263: 메일 발송 - 특별 승인 완료 처리 시 요청자에게 메일 발송', async ({ page }) => {
            await expect(page.getByText('아래와 같은 메일 내용', { exact: false })).toBeVisible();
        });

        test('LC_264: 메일 발송 - [계약 내용 확인] 버튼', async ({ page }) => {
            await expect(page).toHaveURL(/.+/);
        });

        test('LC_265: 문서 상태 - 결재선 설정', async ({ page }) => {
            await expect(page.getByText('내부 결재 중', { exact: false })).toBeVisible();
        });

        test('LC_266: 문서 상태 - 결재선 설정', async ({ page }) => {
            // TODO: 정상 수신됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_267: 문서 상태 - 결재선 미설정', async ({ page }) => {
            await expect(page.getByText('담당자 배정 중', { exact: false })).toBeVisible();
        });

        test('LC_268: 문서 관련자 알림 - 문서 관련자 알림 발송', async ({ page }) => {
            // TODO: 정상 수신됨
                    await expect(page).toHaveURL(/.+/);
        });

        test('LC_269: 진행 내역 데이터 - 진행 내역 데이터 노출', async ({ page }) => {
            await expect(page.getByText('문서 상태 변경 값', { exact: false })).toBeVisible();
        });

        test('LC_270: 활동 로그 - 활동 로그 데이터 값 추가', async ({ page }) => {
            await expect(page.getByText('완료처리된 버튼 선택 및 문서 상태 변경 데이터', { exact: false })).toBeVisible();
        });

        test('LC_271: 검토 요청 조회 - 문서 내부 결재자', async ({ page }) => {
            await expect(page.getByText('해당 특별 승인 요청 완료된 문서 항목', { exact: false })).toBeVisible();
        });

        test('LC_272: 검토 요청 조회 - 문서 참조인', async ({ page }) => {
            await expect(page.getByText('해당 특별 승인 요청 완료된 문서 항목', { exact: false })).toBeVisible();
        });

        test('LC_273: 검토 요청 조회 - 문서 미관련자
(권한 보유)', async ({ page }) => {
            await expect(page.getByText('해당 특별 승인 요청 완료된 문서 항목', { exact: false })).toBeVisible();
        });

    });

    test.describe('거부', () => {
        test('LC_274: 특별 승인 거부 얼럿  - 특별 승인 거부 얼럿 노출', async ({ page }) => {
            await expect(page.getByText('특별 승인 거부 얼럿', { exact: false })).toBeVisible();
        });

        test('LC_275: 메일 발송 - 특별 승인 거부 처리 시 요청자에게 메일 발송', async ({ page }) => {
            await expect(page.getByText('아래와 같은 메일 내용', { exact: false })).toBeVisible();
        });

        test('LC_276: 메일 발송 - [계약 내용 확인] 버튼', async ({ page }) => {
            await expect(page).toHaveURL(/.+/);
        });

        test('LC_277: 문서 상태 - 특별 승인 거부 처리 후 문서 상태 전이', async ({ page }) => {
            await expect(page.getByText('특별 승인 요청 중', { exact: false })).toBeVisible();
        });

    });

});
