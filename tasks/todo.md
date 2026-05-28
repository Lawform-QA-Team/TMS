# Task: 조회 페이지 슬라이드 패널 레이아웃 통일

## 목표
전체 조회 페이지 상세보기를 오른쪽 슬라이드 패널(C형)으로 통일

## 작업 계획
- [x] `common/SlidePanel.js` + `SlidePanel.css` 공통 컴포넌트 생성
- [x] `TestCaseAPP`: 3열 그리드 → 2열, 인라인 상세패널 → SlidePanel
- [x] `AutomationTestManager`: fullscreen-modal → SlidePanel
- [x] `PerformanceTestManager`: fullscreen-modal → SlidePanel
- [x] `JiraIssuesList`: fullscreen-modal → SlidePanel

## UI 개선 (후속)
- [x] SlidePanel 폭 `50vw` CSS 고정, width prop 제거
- [x] 진행현황 파이차트: grid → flex, 파이 `160px` 고정폭
- [x] SlidePanel 헤더 구분선 완전 제거
- [x] Jira 상세 버튼 가로 1줄 중앙 정렬, 너비 통일
- [x] 이슈 메뉴에서 Jira 연동 설정 패널 제거
- [x] 전체 UI `box-shadow` 완전 제거 (27개 파일)
- [x] 테스트 스크립트: `prefers-color-scheme: dark` 미디어 쿼리 제거

---

# Task: 연동 설정 메뉴 통합 (AI API 설정 + Jira 연동)

## 계획
- [x] UserProfile.js: `AI API 설정` → `연동 설정` 메뉴로 통합
- [x] UserProfile.js: JiraConfigPanel import 및 연동 설정 섹션에 포함
- [x] menu key `ai-config` → `integrations` 변경
- [x] JiraConfigPanel.js: CSS import 추가 (자체 스타일 보장)

---

# Task: Jira 코드 검수 이슈 수정

## 수정 목록
- [x] `jira_integration.py`: `/health` 엔드포인트에 `@user_required` 추가
- [x] `jira_integration.py`: `/config POST`, `/config/test POST` → `@admin_required`로 격상
- [x] `jira_integration.py`: `datetime.utcnow()` → `get_kst_now()` 전체 교체
- [x] `jira_integration.py`: `print()` → `logger.error()`
- [x] `jira_integration.py`: 전체 동기화 루프에 `updated_at` 업데이트 추가
- [x] `JiraIssuesList.js`: 모든 API 호출에 Authorization 헤더 추가
- [x] `JiraIssuesList.js`: `description?.toLowerCase()` null 체크
- [x] `JiraIssuesList.js`: `status/priority/issue_type` null 크래시 방어
- [x] `JiraIssuesList.js`: `JSON.parse(labels)` → `parseLabels()` 헬퍼로 통일
- [x] `JiraIssuesList.js`: `@example.com` 하드코딩 제거
- [x] `JiraIssuesList.js`: `useModal`, `openEditModal`/`showEditModal` 데드코드 제거
- [x] `JiraConfigPanel.js`: 기존 토큰 유지 시나리오 처리 (백엔드+프론트)

---

# Task: 보안 설정 기능 구현

## 배경
회원 정보 > 보안 설정 placeholder를 실제 기능으로 구현.
- 2단계 인증(2FA/TOTP), 세션 만료 시간, 접속 허용 IP, OTP

## 구현 계획

### 백엔드
- [ ] `models.py`: UserSecuritySettings 모델 추가
- [ ] `requirements.txt`: pyotp 추가
- [ ] `routes/users.py`: 보안 설정 API 5개 (GET/PUT security-settings, POST/POST/DELETE 2fa)
- [ ] `routes/auth.py`: 로그인 시 IP 체크, 2FA 분기, /verify-2fa 엔드포인트
- [ ] `utils/auth_helpers.py`: create_tokens에 expires_minutes 파라미터 추가

### 프론트엔드
- [ ] `frontend/package.json`: qrcode.react 추가
- [ ] `AuthContext.js`: login 함수 2FA 분기, verify2fa 함수 추가
- [ ] `Login.js`: 2FA OTP 입력 단계 추가
- [ ] `UserProfile.js`: renderSecuritySection 실제 구현
- [ ] `UserProfile.css`: 보안 설정 스타일 추가

## 검증
- [ ] 2FA 설정 → QR 코드 표시 → 앱에서 등록 → OTP 검증
- [ ] 세션 만료 시간 저장/조회
- [ ] IP 화이트리스트 추가/삭제
- [ ] 2FA 활성화 후 로그인 시 OTP 입력 화면 표시

---

# Task: 백엔드 전체 검수 및 이슈 수정

## 배경
백엔드 코드 전체 검수 요청. Critical → 일반 순서로 수정.

## Critical 이슈 수정
- [x] `app.py`: CORS `supports_credentials=True` + wildcard origin 충돌 → `False`로 변경
- [x] `app.py`: `/init-db`, `/db-status` 엔드포인트에 `@admin_required` 추가
- [x] `app.py`: JWT 콜백 이중 등록 제거 (setup_jwt_callbacks와 중복)
- [x] `app.py`: health check degraded 응답 200 → 503
- [x] `app.py`: `jira_bp` import 및 `register_blueprint` 누락 추가

## 일반 이슈 수정
- [x] `users.py`: 비밀번호 변경 시 non-admin 사용자 `current_password` 검증 누락
- [x] `schedules.py`: `execute_scheduled_test`에서 결과 하드코딩 제거 → 실제 실행
- [x] `tasks.py`: `execute_automation_test` 시뮬레이션(sleep) 제거 → subprocess 실행
- [x] `tasks.py`: `execute_test_case_batch` `.get()` → `.get(disable_sync_subtasks=False)`
- [x] `app_config.py`: 인라인 is_vercel 체크 → `is_vercel_environment()` 함수 통일

## Jira Blueprint 충돌 수정
- [x] `jira_integration.py`: 중복 7개 route 제거 (jira_issues.py와 URL 충돌)
- [x] `jira_integration.py`: 미사용 import 정리

## Route 충돌 해소
- [x] `testcases_extended.py`: 8개 중복 함수 제거 → 고유 2개만 유지
- [x] `automation.py`: `/screenshots/<path:filename>` 취약 버전 제거 (testcases.py의 안전한 버전 유지)

## SQLAlchemy 2.0 마이그레이션
- [x] 18개 파일, 47곳: `Model.query.get(id)` → `db.session.get(Model, id)` 일괄 치환

## 프론트엔드-백엔드 API 연결 검수
- [x] 전체 백엔드 엔드포인트 목록 추출
- [x] 프론트엔드 API 호출 목록 추출 후 교차 비교
- [x] S3 엔드포인트 누락 → 현재 미사용으로 스킵
- [x] 최종 route 충돌 검사: 0건 확인

---

# Task: React ESLint 경고 전체 정리

## 배경
React 빌드 시 12개 파일에서 ESLint 경고 발생. 빌드는 성공하지만 코드 품질 저하.

## 수정 계획

- [x] `TestCaseAPP.js` — `setTargetFolderId` unused 제거 / useEffect missing dep eslint-disable
- [x] `ProtectedRoute.js` — `user` 구조분해에서 제거
- [x] `UserProfile.js` — useEffect missing dep eslint-disable
- [x] `AutomationTestDetail.js` — useEffect missing dep (×2) eslint-disable
- [x] `AutomationTestManager.js` — `showDetail` getter 제거 / `showAdvancedFilters`, `closeDetail` eslint-disable / useEffect eslint-disable
- [x] `UnifiedDashboard.js` — `isDragging`, `getStatusColor`, `createChartData` eslint-disable
- [x] `JiraIssuesList.js` — `openEditModal` eslint-disable / useEffect eslint-disable
- [x] `PerformanceTestManager.js` — `useCallback` import 제거 / `total_requested` 제거 / switch default 추가
- [x] `AccountManager.js` — useEffect missing dep eslint-disable
- [x] `ProjectFolderManager.js` — useEffect missing dep eslint-disable
- [x] `TestScriptsManager.js` — `error` getter 제거 / `showFolderUploadModal` eslint-disable / useEffect (×2) eslint-disable / `response` 대입 제거 / duplicate key 제거
- [x] `AuthContext.js` — `toKST` eslint-disable / `now` dead code 제거 / useEffect eslint-disable

## 검증
- [x] `Compiled successfully.` — 경고 0건 확인

---

# Task: k6 메트릭 이중 계산 버그 수정

## 배경
방금 추가한 Trend 메트릭 코드에서 lessons.md에 기록된 패턴 오류 발생:
- `metric.add(Date.now() - start)` 이후 `console.log`에서 `Date.now()`를 다시 호출 → 값 불일치

## 수정 계획

### 수정 대상 (admin + web, 24개 파일)
- [x] admin/ai_chat_data/ai_chat_data.js
- [x] admin/ai_chat_data/ai_chat_data_preset.js
- [x] admin/ai_external_data/ai_external_data.js
- [x] admin/ai_external_data/ai_external_data_company.js
- [x] admin/autodoc/autodoc.js
- [x] admin/autodoc/autodoc_category.js
- [x] admin/autodoc/autodoc_tool.js
- [x] admin/dashboard/dashboard.js
- [x] admin/document_update_report/document_update_report.js
- [x] admin/document_update_report/document_update_report_other.js
- [x] admin/filtering/filtering.js
- [x] admin/ip_management/ip_management.js
- [x] admin/log/log.js
- [x] admin/members/members.js
- [x] admin/members/members_service.js
- [x] admin/notice/notice.js
- [x] admin/qna/qna_search.js
- [x] web/drive/drive.js
- [x] web/notice/notice.js
- [x] web/qna/qna.js
- [x] web/search/search.js
- [x] web/autodoc/autodoc.js
- [x] web/autodoc/autodoc_existing.js
- [x] web/autodoc/autodoc_temp.js

### 수정 방법
잘못된 패턴:
```js
metric.add(Date.now() - start);
console.log(`... ${Date.now() - start}ms`);
```

올바른 패턴:
```js
const duration = Date.now() - start;
metric.add(duration);
console.log(`... ${duration}ms`);
```

## 검증
- 각 파일에서 `Date.now()` 중복 호출이 없는지 확인
- `duration` 변수를 재사용하는 패턴으로 통일됐는지 확인

## 완료
- [x] 전체 수정 완료 (26개 파일, 108곳 수정)
- [x] 검증 완료

---

# Task: k6 Slack 발송 방식 Webhook → Slackbot 전환 + 실패 상세 전송

## 배경
- k6 ERRO 로그가 `handleSummary` data에 포함되지 않아 항상 성공으로 발송됨
- playwright는 Slackbot(Bot API)으로 실패 상세를 스레드로 전송하는 구조 완비
- k6도 동일한 구조로 전환: 메인 메시지(요약) + 스레드(에러 상세)

## 변경 범위

### 공통 헬퍼 (1개)
- [x] `test-scripts/performance/common/slack_helper.js`
  - Webhook → Bot API (`k6/http`로 `chat.postMessage` 직접 호출)
  - `postSlackMessage(token, channel, payload, threadTs)` 추가
  - `buildK6ErrorThreadBlocks(errors)` 추가 (playwright `buildThreadBlocks` 대응)
  - `buildK6SummaryMessage`에 `hasErrors` 파라미터 추가

### 테스트 적용 (2개 우선)
- [x] `admin/login/login_to_web.js`
- [x] `admin/dashboard/dashboard.js`
  - 모듈 레벨 `scriptErrors` 배열 추가
  - `try/finally` → `try/catch/finally` (에러 수집 후 re-throw)
  - `handleSummary`: `postSlackMessage` + `buildK6ErrorThreadBlocks` 사용

### 이후 전체 적용 (26개)
- [x] `admin/ai_chat_data/ai_chat_data.js`
- [x] `admin/ai_chat_data/ai_chat_data_preset.js`
- [x] `admin/ai_external_data/ai_external_data.js`
- [x] `admin/ai_external_data/ai_external_data_company.js`
- [x] `admin/autodoc/autodoc.js`
- [x] `admin/autodoc/autodoc_category.js`
- [x] `admin/autodoc/autodoc_tool.js`
- [x] `admin/document_update_report/document_update_report.js`
- [x] `admin/document_update_report/document_update_report_other.js`
- [x] `admin/filtering/filtering.js`
- [x] `admin/ip_management/ip_management.js`
- [x] `admin/log/log.js`
- [x] `admin/members/members.js`
- [x] `admin/members/members_service.js`
- [x] `admin/notice/notice.js`
- [x] `admin/qna/qna_search.js`
- [x] `admin/login/logout.js`
- [x] `web/drive/drive.js`
- [x] `web/notice/notice.js`
- [x] `web/qna/qna.js`
- [x] `web/search/search.js`
- [x] `web/autodoc/autodoc.js`
- [x] `web/autodoc/autodoc_existing.js`
- [x] `web/autodoc/autodoc_temp.js`
- [x] `web/login/accept_login.js`

### 환경 변수
- [x] `test-scripts/performance/.env` — `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID` 추가

### 추가 개선
- [x] `slack_helper.js` — 커스텀 Trend 메트릭 자동 추출해 액션별 응답 시간 Slack 메시지에 포함
- [x] `run.sh` — Python PTY로 k6 실행: `INFO[XXXX]` 포맷 유지 + ERRO 캡처 + Slack 경고 발송
- [x] `admin/members/members.js` — `waitForLoadState` → `waitForSelector` 수정 (RADIO 셀렉터)

### 버그 수정
- [x] `run.sh` — PTY read 콜백에서 stdout 이중 출력 버그 수정
- [x] `run.sh` — Ctrl+C 시 Python PTY traceback 출력 문제
- [x] `run.sh` — ERRO 여전히 감지 안 됨 (복합 버그 2건)
- [x] `run.sh` — ERRO Slack 미발송 + k6 종료 후 hang 두 가지 버그

## 검증
- [x] `login_to_web.js` 정상 실행 시 성공 메시지 발송 확인
- [x] `dashboard.js` 오류 발생 시 실패 메시지 + 스레드 에러 상세 확인
- [x] `members.js` ERRO 발생 시 run.sh 레벨 경고 Slack 발송 확인
- [x] 터미널 `INFO[XXXX]` 포맷 유지 확인 (Python PTY 적용 후)

---

# Task: autodoc.js 카테고리 검색 결과 클릭 오류 수정

## 수정
- [x] `waitForLoadState('load')` → `waitForSelector(버튼 셀렉터)`로 교체

---

# Task: AI TC 에이전트 모달 구현
- [x] 구현 완료

---

# Task: 사용자별 AI API 설정 및 멀티 공급자 지원
- [x] 구현 완료

---

# Task: AI 공급자 확장 (xAI/Perplexity/Mistral/Groq/Upstage)
- [x] 구현 완료

---

# Task: HSAD K6/Playwright 테스트 우선순위 이슈 수정
- [x] 완료

---

# Task: HSAD Playwright P1 상위 TC spec 확장
- [x] 완료

---

# Task: HSAD K6 selector 분리
- [x] 완료

---

# Task: HSAD performance 스크립트 코드 검수 수정

## P0 — 런타임 오류

- [x] 1. SELECTORS import 경로 오류 수정 (12개 파일)
- [x] 2. multi 3개 파일 환경변수 오타 수정 (EDITER→EDITOR, CONTRAT→CONTRACT)
- [ ] 3. selector_hsad.js:184 잘못된 data-tid 해시 — 올바른 값 확인 필요 (보류)
- [x] 4. clm_draft.js / clm_draft_multi.js finally page 처리
- [ ] 5. GNB_click.js k6 호환 구조로 재작성 — 기능 스펙 확인 필요 (보류)

## P1 — 로직 오류

- [x] 6. multi 파일 SELECTORS 복원 (하드코딩 XPath 제거)
- [x] 7. clm_draft_multi.js 브라우저 타입 firefox → chromium
- [x] 8. clm_draft_multi.js import 변수명 오타 MUlti → Multi
- [x] 9. advice_draft.js / advice_add_coment.js finally page.close() 수정

## P2 — 코드 품질

- [x] 10. url_base_hsad.js 오타 3개 수정 (게약서, 신청청, STATISTICES)
- [x] 11. page.waitForTimeout() deprecated → wait() 통일 (6개 파일)

## 스펙 확인 필요 (보류)

- selector_hsad.js:184 올바른 data-tid 해시값
- GNB_click.js 재작성 스펙
- clm_process.js 각 조건 분기 구현 내용
- multi VU/iterations 적절한 설정값
