# LawForm E2E 자동화 테스트

## 디렉토리 구조

```
lawform/
├── actions/                    ← 재사용 가능한 원자 액션
│   ├── common/
│   │   ├── common.login.js     login(page)
│   │   ├── common.modal.js     confirmModal / cancelModal / fillTextarea / clickSave
│   │   └── common.table.js     clickFirstRow / hasRows / clickRowAt
│   ├── clm/
│   │   ├── clm.navigate.js     gotoDraftList / gotoReviewList / gotoDetailOrFirst
│   │   ├── clm.draft.js        clickNewReviewRequest / saveDraft / stopDraft
│   │   ├── clm.legal.js        approveLegalReview / denyLegalReview(reason)
│   │   ├── clm.financial.js    requestFinancialReview / approveFinancialReview / denyFinancialReview(reason)
│   │   ├── clm.final.js        approveFinalReview / denyFinalReview(reason)
│   │   ├── clm.seal.js         requestSeal / approveSeal / denySeal(reason)
│   │   └── clm.esign.js        requestEsign / checkEsignStatus
│   ├── advice/
│   │   ├── advice.navigate.js  gotoDraftList / gotoReviewList / gotoDetailOrFirst
│   │   ├── advice.draft.js     clickNewAdviceRequest / selectAdviceType(type)
│   │   └── advice.review.js    addComment(text) / approveAdvice / denyAdvice(reason)
│   ├── litigation/
│   │   ├── litigation.navigate.js  gotoDraftList / gotoReviewList / gotoScheduleAll / gotoDetailOrFirst
│   │   ├── litigation.draft.js     clickNewLitigationButton
│   │   └── litigation.schedule.js  clickScheduleTab / openAddScheduleModal / switchCalendarView(view)
│   ├── seal/
│   │   ├── seal.navigate.js    gotoReviewList / gotoLedger / gotoDraftList / gotoDetailOrFirst
│   │   └── seal.draft.js       clickNewSealButton / assertDateInputVisible / assertContactInputVisible / assertAttachmentVisible
│   └── misc/
│       └── misc.navigate.js    gotoDashboard / gotoBulkList / gotoStatistics / gotoSetup
│
├── scenarios/                  ← TC 파일 1개 = TMS TC 1개 = Playwright test() 1개
│   ├── clm/
│   │   ├── TC-CLM-S04.scenario.js   법무 검토 승인
│   │   ├── TC-CLM-S05.scenario.js   법무 검토 반려
│   │   ├── TC-CLM-S06.scenario.js   재무검토 요청
│   │   ├── TC-CLM-S07.scenario.js   재무 검토 승인
│   │   ├── TC-CLM-S08.scenario.js   재무 검토 반려
│   │   ├── TC-CLM-S09.scenario.js   최종 승인
│   │   ├── TC-CLM-S10.scenario.js   최종 반려
│   │   ├── TC-CLM-S11.scenario.js   인감사용 신청
│   │   ├── TC-CLM-S12.scenario.js   인감 승인
│   │   ├── TC-CLM-S13.scenario.js   인감 반려
│   │   ├── TC-CLM-S14.scenario.js   전자서명 요청
│   │   └── TC-CLM-S15.scenario.js   전자서명 현황 확인
│   ├── advice/
│   │   ├── TC-ADV-S01.scenario.js   자문 목록 조회
│   │   ├── TC-ADV-S02.scenario.js   신규 자문 요청 (폼 진입)
│   │   ├── TC-ADV-S03.scenario.js   신규 자문 요청 — 계약(cn) 분류 선택
│   │   ├── TC-ADV-S04.scenario.js   신규 자문 요청 — 지재권(pi) 분류 선택
│   │   ├── TC-ADV-S05.scenario.js   코멘트 추가
│   │   ├── TC-ADV-S06.scenario.js   법무 완료 승인
│   │   ├── TC-ADV-S07.scenario.js   법무 반려
│   │   ├── TC-ADV-S08.scenario.js   프로세스 — 요청 단계
│   │   ├── TC-ADV-S09.scenario.js   프로세스 — 검토 단계
│   │   └── TC-ADV-S10.scenario.js   프로세스 — 완료 처리
│   ├── litigation/
│   │   ├── TC-LIT-S01.scenario.js   신규 등록 폼 진입
│   │   ├── TC-LIT-S02.scenario.js   상세 조회
│   │   ├── TC-LIT-S03.scenario.js   일정 탭 조회
│   │   ├── TC-LIT-S04.scenario.js   일정 추가 모달 진입
│   │   └── TC-LIT-S05.scenario.js   전체 일정 — 월/주/일 뷰 전환
│   ├── seal/
│   │   ├── TC-SEAL-S01.scenario.js  목록 조회 (검토/원장/초안)
│   │   └── TC-SEAL-S02.scenario.js  신규 등록 폼 필수 영역 확인
│   ├── misc/
│   │   ├── TC-MISC-S01.scenario.js  대시보드 GNB 네비게이션
│   │   ├── TC-MISC-S02.scenario.js  대시보드 설정 패널
│   │   ├── TC-MISC-S03.scenario.js  대량 문서 목록 조회
│   │   ├── TC-MISC-S04.scenario.js  통계 페이지 조회
│   │   └── TC-MISC-S05.scenario.js  결재 흐름 설정 조회
│   └── regression/
│       └── BUG-template.scenario.js ← 버그 리그레션 작성 가이드 (복사해서 사용)
│
├── selectors/                  ← data-tid 기반 CSS 선택자 (자동 생성)
│   ├── clm.js / advice.js / litigation.js / seal.js / ...
│   └── index.js                ← 전체 re-export
│
├── url_base_lawform.js         ← 서비스별 URL 정의 (URLS.CLM, URLS.ADVICE ...)
├── playwright.lawform.config.js ← Playwright 설정
└── OVERVIEW.md                 ← 이 파일
```

---

## 설계 원칙

### 3계층 아키텍처

```
actions   ←  UI 상호작용 단위 (버튼 클릭, 모달 확인, 페이지 이동)
              재사용의 기본 단위. 여러 TC에서 import해서 조합한다.

scenarios ←  TMS TC 1:1 매핑. actions를 조합해 하나의 테스트를 구성한다.
              파일명 = TC ID = Playwright test 이름.

regression ← 버그 재현 시나리오. 기존 actions를 그대로 재사용해
              재현 조건을 조합하고 expect()로 버그 지점을 마킹한다.
```

### 핵심 규칙

- **TC 파일 1개 = TMS TC ID 1개**: `TC-CLM-S04.scenario.js` → `[TC-CLM-S04]` test
- **환경변수 없음**: 분기 없이 각 TC가 하나의 케이스만 담당 (승인 TC와 반려 TC는 별도 파일)
- **특정 건 지정**: `CLM_ID`, `ADVICE_ID`, `LITIGATION_ID` 환경변수로 대상 지정 가능. 없으면 목록 첫 번째 항목 사용
- **actions는 coarse-grained**: 버튼 클릭 + 모달 확인을 하나의 함수로 묶음. `approveLegalReview(page)` 한 줄로 승인 완료
- **파라미터로 분기**: `denyLegalReview(page, reason)` — 케이스별 별도 함수 대신 파라미터 사용

---

## CLM 진행 단계별 TC 매핑

| 단계 | progress_status | TC |
|------|----------------|-----|
| 법무 검토 승인 | 2 → 3 | TC-CLM-S04 |
| 법무 검토 반려 | 2 → (반려) | TC-CLM-S05 |
| 재무검토 요청 | 3 → 4 | TC-CLM-S06 |
| 재무 검토 승인 | 4 → 5 | TC-CLM-S07 |
| 재무 검토 반려 | 4 → (반려) | TC-CLM-S08 |
| 최종 승인 | 5 → 6 | TC-CLM-S09 |
| 최종 반려 | 5 → (반려) | TC-CLM-S10 |
| 인감사용 신청 | 6 → 7 | TC-CLM-S11 |
| 인감 승인 | 7 → 완료 | TC-CLM-S12 |
| 인감 반려 | 7 → (반려) | TC-CLM-S13 |
| 전자서명 요청 | 7 | TC-CLM-S14 |
| 전자서명 확인 | 7 | TC-CLM-S15 |

---

## 실행 방법

```bash
# 기본 경로
cd test-scripts/playwright

# 전체 실행
npx playwright test --config=lawform/playwright.lawform.config.js

# 도메인별 실행
npx playwright test --config=lawform/playwright.lawform.config.js --grep "CLM"
npx playwright test --config=lawform/playwright.lawform.config.js --grep "ADV"
npx playwright test --config=lawform/playwright.lawform.config.js --grep "LIT"
npx playwright test --config=lawform/playwright.lawform.config.js --grep "SEAL"
npx playwright test --config=lawform/playwright.lawform.config.js --grep "MISC"

# TC 하나만 실행
npx playwright test --config=lawform/playwright.lawform.config.js --grep "TC-CLM-S04"

# 버그 리그레션만 실행
npx playwright test --config=lawform/playwright.lawform.config.js --grep "BUG-"

# HTML 리포트 열기
npx playwright show-report lawform-report
```

### 환경변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `BASE_URL` | LawForm 서비스 URL | (필수) |
| `LOGIN_EMAIL` | 테스트 계정 이메일 | (필수) |
| `LOGIN_PASSWORD` | 테스트 계정 비밀번호 | (필수) |
| `CLM_ID` | 특정 계약 ID 지정 | 목록 첫 번째 항목 |
| `ADVICE_ID` | 특정 자문 ID 지정 | 목록 첫 번째 항목 |
| `LITIGATION_ID` | 특정 송무 ID 지정 | 목록 첫 번째 항목 |

`.env` 파일 위치: `test-scripts/playwright/.env`

```env
BASE_URL=https://your.lawform.url
LOGIN_EMAIL=test@example.com
LOGIN_PASSWORD=yourpassword
```

---

## TC 파일 작성 방법

### 새 TC 추가

```js
// scenarios/{domain}/TC-{ID}.scenario.js
import { test, expect } from '@playwright/test';
import { login }             from '../../actions/common/common.login.js';
import { gotoDetailOrFirst } from '../../actions/clm/clm.navigate.js';
import { approveLegalReview } from '../../actions/clm/clm.legal.js';

test('[TC-CLM-S04] 법무 검토 승인', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await approveLegalReview(page);
    await expect(page.locator('text=재무 검토')).toBeVisible();
});
```

파일을 `scenarios/` 하위에 저장하면 config의 `testMatch: ['scenarios/**/*.scenario.js']` 에 의해 자동으로 discovery된다.

### 버그 리그레션 추가

```
scenarios/regression/BUG-template.scenario.js 복사
  → scenarios/regression/BUG-{이슈번호}.scenario.js 로 저장
  → test.skip 제거
  → 버그 재현 steps 작성 (기존 actions import해서 조합)
  → 버그 확인 지점에 expect() 추가
```

### 새 액션 추가

기존 actions 파일에 함수를 추가하거나, 새 도메인이면 `actions/{domain}/{domain}.{기능}.js` 파일을 생성한다. TC 파일에서 import해서 바로 사용할 수 있다.

---

## CI/CD

`.github/workflows/playwright-lawform.yml` 에 정의되어 있다.

| 트리거 | 조건 |
|--------|------|
| 자동 (push/PR) | `main` 브랜치, `lawform/**` 경로 변경 시 |
| 자동 (스케줄) | 평일 오전 9시 KST |
| 수동 | GitHub Actions → Run workflow → 도메인 선택 가능 |

GitHub Secrets 등록 필요:
- `LAWFORM_BASE_URL`
- `LAWFORM_LOGIN_EMAIL`
- `LAWFORM_LOGIN_PASSWORD`
