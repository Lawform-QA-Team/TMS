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
  - 원인: `pty.spawn` 내부 `_copy`가 이미 stdout 출력 + 콜백에서도 중복 출력
  - 수정: `read` 콜백에서 `sys.stdout.buffer.write` 제거, 캡처만 수행
- [x] `run.sh` — Ctrl+C 시 Python PTY traceback 출력 문제
  - 원인: `pty.spawn` 내부 `select()`에서 KeyboardInterrupt 미처리
  - 수정: `KeyboardInterrupt` 예외 처리 추가, exit code 130으로 정상 종료
  - 추가: exit code 130(Ctrl+C)은 Slack 경고 대상에서 제외
- [x] Slack 이중 발송 구조 개선
  - 현상 1: ERRO 없어도 exit_code=1로 false positive 경고 발송
    원인: OSError break 시 exit_code 초기값(1) 유지 → k6 실제 종료 코드 미반영
    수정: finally에서 waitpid로 실제 종료 코드 획득
  - 현상 2: 실제 ERRO 발생 시 handleSummary 성공 메시지 + run.sh 경고 메시지 충돌
    원인: handleSummary(k6 내부)와 run.sh(외부) 두 곳에서 각각 Slack 발송
    수정: handleSummary에서 Slack 제거, 메트릭을 JSON 파일로 저장 → run.sh에서 ERRO + 메트릭 합쳐 한 번만 발송
- [x] `run.sh` — ERRO 여전히 감지 안 됨 (복합 버그 2건)
  - 버그 1: `mktemp /tmp/k6_XXXXXX.log` → macOS mktemp는 X가 맨 끝이어야 함, `.log` suffix로 인해 실패 → TMPFILE 빈 문자열 → FileNotFoundError
    수정: `mktemp /tmp/k6_XXXXXX` (suffix 제거)
  - 버그 2: shell sed의 ANSI 제거 패턴이 `\x1b[?25l` 등 `?` 포함 시퀀스 미처리
    수정: shell sed 제거, Python의 포괄적 ANSI regex로 교체 + ERRO 라인만 TMPFILE에 저장
- [x] `run.sh` — ERRO Slack 미발송 + k6 종료 후 hang 두 가지 버그
  - 버그 1: `tr -d '\r'` → progress bar와 ERRO가 같은 줄로 합쳐져 `^ERRO` grep 실패
    수정: `tr '\r' '\n'` 으로 변경
  - 버그 2: `pty.spawn`이 stdin도 모니터링 → k6 종료 후에도 stdin 대기로 hang
    수정: `pty.spawn` → `pty.fork()` 직접 구현, stdin 모니터링 제거

## 검증
- [x] `login_to_web.js` 정상 실행 시 성공 메시지 발송 확인
- [x] `dashboard.js` 오류 발생 시 실패 메시지 + 스레드 에러 상세 확인
- [x] `members.js` ERRO 발생 시 run.sh 레벨 경고 Slack 발송 확인
- [x] 터미널 `INFO[XXXX]` 포맷 유지 확인 (Python PTY 적용 후)
- [ ] 이중 발송 구조 수정 후 `login_to_web.js` 실행 → Slack 단일 발송 확인 (성공 시 ✅)
- [ ] 이중 발송 구조 수정 후 `members.js` ERRO 발생 시 단일 경고 발송 확인 (주황색, CDP 오류 포함)

---

# Task: CDP 런타임 오류 실패 처리 강화

## 배경
ERRO 로그가 있어도 Slack에 "성공"으로 발송되는 문제:
- CDP 런타임 오류는 JS try/catch를 우회 → `scriptErrors` 미수집
- `checks` threshold가 vacuously true (check() 호출 없음)
- run.sh에서 ERRO를 주황 경고로만 표시, 실패로 처리하지 않음

## 수정 계획

### k6 스크립트 (`members_service.js`)
- [x] `import { check } from 'k6'` 추가
- [x] `const pageErrors = []` 모듈 레벨 선언
- [x] `page.on('pageerror', ...)` 리스너 등록 (page 생성 직후)
- [x] try 블록 끝에 `check(null, { '런타임 오류 없음': () => pageErrors.length === 0 })` 추가
- [x] `handleSummary`에서 `pageErrors`를 `scriptErrors`와 병합해 `allErrors`로 전달

### run.sh
- [x] ERRO 존재 시 주황 경고 → 빨간 실패로 격상
  - payload text `': 성공'` → `': 실패'` 치환
  - attachment color `#ff9900` → `#ff0000`
  - header 블록 `✅` → `❌` 치환
  - section fields 중 `*상태:*` → `*상태:*\n실패` 갱신
  - "대상 페이지 성능 측정 완료!" 블록 제거

## 검증
- [ ] members_service.js 실행 후 ERRO 발생 시 Slack에 ❌ 실패로 발송 확인
- [ ] ERRO 없을 때는 기존대로 ✅ 성공 발송 확인

---

# Task: autodoc.js 카테고리 검색 결과 클릭 오류 수정

## 배경
`autodoc.js` 실행 시 `TypeError: Cannot read property 'click' of undefined or null` 발생.
카테고리 검색 결과 버튼이 DOM에 나타나기 전에 `$$`로 조회하여 빈 배열 반환.

## 수정
- [x] `waitForLoadState('load')` → `waitForSelector(버튼 셀렉터)`로 교체
  - 파일: `admin/autodoc/autodoc.js` 71번 라인

## 검토
- 카테고리 버튼이 실제 DOM에 나타난 후 `$$` 조회하므로 빈 배열 방지
