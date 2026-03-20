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
| 리포트 | 없음 | `handleSummary()` — HTML + metrics JSON 기록 (Slack은 run.sh에서 단일 발송) |
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

### k6 - waitForSelector + click 패턴의 race condition

**현상**: `waitForSelector` 성공 후 `page.click()` 시 "element is not attached to the DOM" 에러 발생

**원인**: `waitForSelector`가 요소를 찾은 직후 SPA 테이블이 검색 결과로 re-render됨. `page.click()` 호출 시점에는 이미 해당 DOM 노드가 detach된 상태.

**수정**: `page.locator(selector).click()` 사용 — locator는 클릭 시점에 요소를 재쿼리하므로 race condition 방지

```javascript
// 나쁜 패턴
await page.waitForSelector(selector);
await page.click(selector); // detach 가능

// 좋은 패턴
await page.waitForSelector(selector);  // 출현 확인
await page.locator(selector).click();  // 클릭 시점에 재쿼리
```

**교훈**:
- 검색/필터 후 테이블 클릭은 반드시 `locator().click()` 사용
- `waitForSelector`는 출현 확인용, 클릭은 `locator().click()`으로 분리

---

### k6 - page.$$() 사용 전 반드시 waitForSelector 선행

**현상**: `Cannot read property 'click' of undefined or null` — `$$()` 결과 배열이 비어있음

**원인**: `waitForLoadState('load')` 후 `$$`로 요소 조회 시, SPA에서 해당 요소가 아직 렌더링되지 않은 상태일 수 있음

**수정**: `waitForLoadState` 대신 실제 대상 셀렉터로 `waitForSelector`를 사용하여 해당 요소 출현 보장

**교훈**:
- `page.$$()` 앞에는 반드시 `page.waitForSelector(동일 셀렉터)` 선행
- `waitForLoadState('load')`는 DOM 요소 출현을 보장하지 않음

---

### run.sh - tee 파이프 사용 시 k6 로그 포맷이 변경됨

**현상**: `2>&1 | tee` 로 출력 캡처 시 로그 포맷이 `INFO[0003] msg` → `time="2026-03-20T..." level=info msg="..."` 로 변경됨. 실시간 progress bar도 인플레이스 갱신이 아닌 줄 단위 반복으로 변경됨

**원인**: k6는 stderr가 TTY인지 감지해 TTY일 때 상대 타임스탬프(`INFO[XXXX]`) + 인플레이스 progress bar를 사용함. 파이프(`tee`)를 통하면 TTY 감지 실패 → ISO 타임스탬프 + 줄 단위 출력으로 전환됨

**해결**: Python `pty` 모듈로 가짜 PTY를 생성해 k6에게 TTY처럼 보이게 실행하면서 출력을 동시에 캡처
```python
import pty, os, sys

captured = bytearray()

def read(fd):
    try:
        data = os.read(fd, 4096)
        sys.stdout.buffer.write(data)
        sys.stdout.buffer.flush()
        captured.extend(data)
        return data
    except OSError:
        return b''

status = pty.spawn(cmd, read)
# 캡처된 데이터에서 ANSI 코드 제거 후 ERRO 라인 추출
```

**교훈**:
- k6 출력을 캡처하면서 포맷을 유지하려면 반드시 PTY 래퍼 필요
- Python `pty` 모듈은 macOS 기본 내장 → 추가 설치 없이 사용 가능
- 캡처된 PTY 출력에는 ANSI 코드가 포함되므로 grep 전에 반드시 제거 (`tr -d '\r' | sed $'s/\x1b\\[[0-9;]*[A-Za-z]//g'`)
- `pty.spawn`의 `master_read` 콜백은 **캡처 전용**으로만 사용할 것. 콜백 내에서 직접 stdout에 쓰면 `_copy` 내부 출력과 중복되어 로그가 2번 출력됨
- `pty.spawn`은 stdin도 함께 모니터링함 → 자식 프로세스 종료 후에도 stdin 대기로 hang 발생. **`pty.fork()` + 직접 select 루프**로 구현해야 stdin 모니터링 없이 자식 종료 즉시 반환 가능
- PTY 출력에서 ERRO 라인 grep 시 `tr -d '\r'` 사용 금지. progress bar가 `\r`로 ERRO와 같은 줄에 합쳐져 `^ERRO`가 매칭 안 됨. `tr '\r' '\n'`으로 변환해도 shell sed의 ANSI 제거가 불완전함 → **Python에서 포괄적 ANSI regex로 처리하고 ERRO 라인만 파일에 저장**하는 것이 가장 안전
- shell의 ANSI 제거 regex(`\x1b\\[[0-9;]*[A-Za-z]`)는 `\x1b[?25l` 같은 `?` 포함 CSI 시퀀스를 처리 못 함. Python `re.compile(rb'\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07]*\x07)')` 사용
- macOS `mktemp`는 X가 반드시 **맨 끝**에 있어야 함. `mktemp /tmp/k6_XXXXXX.log`는 실패(빈 문자열 반환) → `mktemp /tmp/k6_XXXXXX` 사용
- Ctrl+C(exit code 130)는 정상 인터럽트이므로 Slack 오류 알림 대상에서 제외해야 함

---

### k6 browser - CDP 에러는 JS try/catch를 우회함 + 이중 감지 구조

**현상**: `try/catch`와 `scriptErrors` 배열을 추가했음에도 ERRO 발생 시 `scriptErrors`가 비어있어 Slack에 성공으로 발송됨

**원인**: k6 browser 모듈에서 발생하는 일부 에러(`page.$$()` 빈 배열 클릭 등)는 CDP(Chrome DevTools Protocol) 레이어에서 k6 런타임으로 올라오는 "Uncaught (in promise)"로 처리됨. 이 에러는 JS의 `try/catch`를 우회하기 때문에 catch 블록이 실행되지 않음

추가 원인: `checks: ['rate==1.0']` threshold가 있어도 `check()` 호출이 없으면 0 pass / 0 fail → vacuously true → 실패 판정 안 됨

**3단계 감지 구조**:
1. **JS try/catch** (`scriptErrors`): 일반 JS 예외 수집 → `handleSummary`에서 스레드 발송
2. **page.on('pageerror')** (`pageErrors`): 브라우저 페이지 레벨 JS 오류 수집 → `check()`로 threshold 실패 유발
   ```js
   page.on('pageerror', (err) => {
       pageErrors.push({ message: `[PageError] ${err.message || String(err)}`, time: new Date().toISOString() });
   });
   // try 블록 끝에:
   check(null, { '런타임 오류 없음': () => pageErrors.length === 0 });
   ```
3. **Shell 레벨** (`run.sh`): k6 출력 ERRO 라인 감지 → 실패로 격상 (color #ff0000, 상태 실패, ❌)

**handleSummary에서 pageErrors 병합**:
```js
const allErrors = [...scriptErrors, ...pageErrors];
output[metricsFile] = JSON.stringify({
    payload: buildK6SummaryMessage(data, 'Test Name', allErrors.length > 0),
    scriptErrors: allErrors,
});
```

**교훈**:
- `checks` threshold만 선언하고 `check()`를 호출하지 않으면 항상 통과됨 — 반드시 `check()` 호출 필요
- k6 browser 에러는 JS try/catch만으로는 완전히 감지 불가 → `page.on('pageerror')` 필수
- run.sh 레벨 ERRO 감지는 CDP 레이어 오류까지 커버하는 최후 안전망
- ERRO 존재 시 주황 경고가 아닌 빨간 실패로 처리해야 상태가 명확함

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

### k6 Slack - 액션별 응답 시간 자동 포함

**배경**: 각 스크립트에서 `Trend` 메트릭으로 측정한 액션별 응답 시간을 Slack 메시지에 포함하고 싶었으나, 개별 스크립트를 수정하지 않고 공통 헬퍼에서 해결

**해결**: `buildK6SummaryMessage`에서 `data.metrics`를 순회해 커스텀 Trend 메트릭을 자동 추출
- 표준 k6 메트릭(`http_*`, `browser_*`, `iterations`, `vus`, `data_*`, `checks`, `group_duration`) 제외
- 나머지 `avg`를 가진 메트릭 = 커스텀 Trend로 판별
- 메트릭명 snake_case → 공백 변환 후 `avg / p95` 형태로 표시

**교훈**:
- 개별 스크립트를 수정하지 않고 `handleSummary` data만으로 커스텀 메트릭 추출 가능
- 새 스크립트에 Trend 메트릭 추가해도 Slack 메시지에 자동 반영됨 — 헬퍼 수정 불필요
- Slack `section.fields` 최대 10개 제한 → 초과 시 블록 분할 필요

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

### k6 Slack - 이중 발송 구조 (handleSummary + run.sh 충돌)

**현상**: 실제 ERRO 발생 시 Slack에 성공 메시지(handleSummary)와 경고 메시지(run.sh)가 동시 전송되어 충돌

**원인**: CDP 레벨 에러(ERRO 로그)는 JS `try/catch`를 우회 → `scriptErrors`에 수집 안 됨 → handleSummary는 성공으로 판단. run.sh는 ERRO 감지 → 경고 발송. 두 발신자가 독립적으로 동작.

**해결**:
- `handleSummary`에서 Slack 발송 완전 제거
- `handleSummary`는 메트릭 JSON을 `__ENV._K6_METRICS_FILE`로 지정된 임시 파일에 기록
- `run.sh`가 k6 종료 후 JSON(메트릭+scriptErrors) + ERRO 라인을 합쳐 **한 번만** Slack 발송
- ERRO 존재 시 payload 색상을 주황(`#ff9900`)으로 변경 + CDP 오류 블록 추가

**아키텍처**:
```
k6 실행 (run.sh) →
  handleSummary: metrics JSON → _K6_METRICS_FILE 기록 (Slack 전송 없음)
  PTY: ERRO 라인 → _K6_TMPFILE 기록
run.sh (Python): JSON + ERRO 합쳐 Bot API로 단일 발송
```

**교훈**:
- k6 내부(handleSummary)와 외부(run.sh) 두 곳에서 Slack을 발송하면 반드시 충돌 발생
- run.sh를 통해 실행되는 경우 항상 외부(run.sh)에서 단일 발송하는 구조가 옳음
- `_K6_METRICS_FILE` env var를 통해 k6 → shell 간 데이터 전달

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
