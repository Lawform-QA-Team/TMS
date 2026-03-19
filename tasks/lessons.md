# Lessons Learned

---

## 워크플로우 규칙 (항상 적용)

### Playwright ↔ K6 양방향 동기화

`test-scripts/playwright/samsung/real/` 또는 `test-scripts/performance/samsung/real/` 중 한쪽의 **로직**이 변경되면, 반드시 **양쪽 모두** 반영할 것.

**동기화 대상** (항상 양쪽 동일):
- URL / 셀렉터 변경
- 로직 흐름 변경 (단계 추가·삭제·순서 변경)
- 입력값 / 파라미터 변경

**동기화 제외** (프레임워크 특성 유지):

| 항목 | Playwright 유지 | K6 유지 |
|------|----------------|---------|
| 입력 방식 | `locator().fill()` / `locator().first().fill()` | 동일하게 유지 (빈 필드만 `type()` 허용) |
| 로그인 | `getWebCredentials()` + `loginWithPage(page, creds, url)` | `getCredentials()` + `loginWithPage(page, creds)` |
| 메트릭 | 없음 | `Trend`, `Date.now()` 기반 duration 변수 저장 후 재사용 |
| 리포트 | 없음 | `handleSummary()` — HTML + Slack |
| 구조 | `export async function run(page)` | `export default async function()` + `browser.newContext()` + `try/finally` |

**파일 매핑**:
```
playwright/.../admin/ai_chat_data/ai_chat_data.js        ↔  performance/.../admin/ai_chat_data/ai_chat_data.js
playwright/.../admin/ai_chat_data/ai_chat_data_preset.js ↔  performance/.../admin/ai_chat_data/ai_chat_data_preset.js
playwright/.../admin/ai_external_data/ai_external_data.js↔  performance/.../admin/ai_external_data/ai_external_data.js
playwright/.../admin/dashboard/dashboard.js              ↔  performance/.../admin/dashboard/dashboard.js
playwright/.../admin/filtering/filtering.js              ↔  performance/.../admin/filtering/filtering.js
playwright/.../admin/notice/notice.js                    ↔  performance/.../admin/notice/notice.js
playwright/.../web/drive/drive.js                        ↔  performance/.../web/drive/drive.js
playwright/.../web/notice/notice.js                      ↔  performance/.../web/notice/notice.js
playwright/.../web/qna/qna.js                            ↔  performance/.../web/qna/qna.js
```

---

## 2026-03-19

### playwright → k6 포팅 시 - `page.type()` vs `page.locator().fill()` 혼용 주의

**현상**: k6 수정/등록 폼에서 기존 내용에 텍스트가 추가됨 (덮어쓰기 안 됨)

**원인**: playwright 코드에서 `page.locator(selector).fill(value)`를 사용하는 부분을, k6로 포팅할 때 `page.type(selector, value)`로 변환함. `fill()`은 필드를 초기화 후 입력하지만, `type()`은 기존 내용 뒤에 추가(append)됨.

**영향을 받은 파일**:
- `admin/notice/notice.js` - INPUT_TITLE, contenteditable (등록/수정 모두)
- `admin/ai_chat_data/ai_chat_data_preset.js` - INPUT, TEXTAREA (수정 섹션)
- `web/qna/qna.js` - contenteditable 첫째줄

**교훈**:
- playwright 코드에서 `locator().fill()`은 반드시 k6에서도 `locator().fill()`로 유지할 것
- 빈 필드 입력은 `type()`도 무방하지만, **기존 값이 있을 수 있는 수정(Edit) 폼**에서는 반드시 `fill()` 사용
- contenteditable 요소는 `.first().fill()` → Enter → `.first().type()` 패턴을 유지할 것

---

## 2026-03-19

### k6 브라우저 테스트 - 로그인 후 페이지 잔류 현상

**현상**: 로그인 버튼 클릭 → 로그인 페이지 잔류 (이후 goto가 세션 없이 실행됨)

**원인**: `loginWithPage`에서 로그인 버튼 클릭 후 네비게이션 완료를 기다리지 않고 즉시 리턴. 임시방편이었던 `await wait(2000)`이 주석 처리된 상태였음.

**수정**: 클릭 후 `await page.waitForURL(URLS.LOGIN.DASHBOARD)` 추가 → 대시보드 도달 확인 후 리턴

**교훈**:
- k6 browser에서 `page.click()` 후 페이지 전환이 발생하는 경우, 반드시 `waitForURL` 또는 `waitForNavigation`으로 완료를 확인할 것
- `await wait(N)`처럼 고정 시간 대기는 근본 해결책이 아님 — 명확한 조건 대기로 대체할 것
- 로그인 헬퍼처럼 공통 함수에서 네비게이션 완료를 보장하지 않으면, 이를 호출하는 모든 스크립트에서 세션 문제가 발생할 수 있음

---

### k6 성능 측정 - 측정 종료 시점 오류

**현상**: Search/Register/TableClick 메트릭이 실제 사용자 체감 시간보다 훨씬 짧게 측정됨

**원인**: `page.click()` 직후 타이머 종료 — 클릭 후 결과 렌더링 완료를 기다리지 않음

**교훈**:
- 성능 측정은 **사용자가 결과를 볼 수 있는 시점**까지 해야 의미 있음
- 클릭 후 `waitForSelector` 또는 `waitForLoadState`로 실제 완료 시점을 잡을 것

---

### k6 - page.$$() 사용 전 반드시 waitForSelector 선행

**현상**: `Cannot read property 'click' of undefined or null` — `$$()` 결과 배열이 비어있음

**원인**: `waitForLoadState('load')` 후 `$$`로 요소 조회 시, SPA에서 해당 요소가 아직 렌더링되지 않은 상태일 수 있음

**수정**: `waitForLoadState` 대신 실제 대상 셀렉터로 `waitForSelector`를 사용하여 해당 요소 출현 보장

**교훈**:
- `page.$$()` 앞에는 반드시 `page.waitForSelector(동일 셀렉터)` 선행
- `waitForLoadState('load')`는 DOM 요소 출현을 보장하지 않음

---

### k6 Slack 발송 - ERRO 로그가 handleSummary에 노출되지 않음

**현상**: k6 실행 중 `ERRO` 로그가 출력되어도 Slack에는 항상 성공으로 발송됨

**원인**:
- k6의 `ERRO` 로그(uncaught exception 등)는 `handleSummary`의 `data` 객체에 포함되지 않음
- 기존 `iterFails = metrics.iterations?.values?.fails` 경로 자체가 존재하지 않는 필드라 항상 0

**해결**:
- 각 스크립트의 `default` 함수에 `try/catch` 추가 → 에러를 모듈 레벨 `scriptErrors` 배열에 수집 후 `throw e`로 re-throw
- `handleSummary`에서 `scriptErrors.length > 0`을 `buildK6SummaryMessage`의 `hasErrors`로 전달 → 실패 판정
- 에러 상세는 `buildK6ErrorThreadBlocks(scriptErrors)`로 스레드 답글 발송 (playwright 구조와 동일)

**교훈**:
- k6에서 실행 중 에러 감지가 필요하면 `handleSummary` data에 의존하지 말고 직접 `catch`로 수집할 것
- `try/finally` 구조에서 `catch`가 없으면 에러 정보는 소실됨

---

### k6 Slack - Webhook 대신 Bot API 사용 (슬랙봇)

**배경**: Webhook은 파일 첨부, 스레드 답글, 메시지 수정 불가 — 에러 상세를 스레드로 분리 전송하려면 Bot API 필요

**구조**:
```
메인 메시지: 테스트 요약 (성공/실패/메트릭)
  └─ 스레드: 에러 상세 (메시지 + 스택 + 발생 시각)
```

**k6 사용 시 주의**:
- `@slack/web-api` SDK는 Node.js 전용 → k6에서 사용 불가
- `k6/http`로 `https://slack.com/api/chat.postMessage` 직접 호출
- 첫 메시지 응답의 `ts` 값을 `thread_ts`로 전달하면 스레드 답글 가능
- 환경 변수: `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`

---

### k6 성능 측정 - Date.now() 이중 계산

**현상**: 메트릭에 기록된 값과 로그에 출력된 값이 항상 다름

**원인**: `metric.add(Date.now() - start)` 이후 `console.log`에서 `Date.now()`를 다시 호출

**교훈**:
- duration은 변수에 한 번만 저장하고 재사용할 것
  ```javascript
  const duration = Date.now() - start;
  metric.add(duration);
  console.log(`duration: ${duration}ms`);
  ```
