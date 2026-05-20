# Lessons Learned

---

## 워크플로우 필수 순서

**커밋 전 반드시 .md 업데이트 먼저:**
1. `tasks/todo.md` — 완료 항목 체크 및 검토 섹션 추가
2. `tasks/lessons.md` — 새로 얻은 교훈 기록
3. 그 다음 커밋 (코드 + .md 파일 함께)

---

## UI 메뉴 통합 패턴

- 관련된 외부 서비스 설정들은 하나의 "연동 설정" 메뉴로 묶는 것이 UX상 좋음
- 독립 컴포넌트(JiraConfigPanel 등)를 다른 페이지에서 재사용할 때: 해당 컴포넌트 파일에 CSS import를 직접 추가해 자립성 확보
- `JiraIssuesList.css`처럼 여러 컴포넌트 스타일이 하나의 CSS에 혼재할 때, 해당 CSS를 사용하는 각 컴포넌트가 직접 import하면 어디서든 동작 보장

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

### k6 browser - CDP 에러는 JS try/catch를 우회함

**현상**: `try/catch`와 `scriptErrors` 배열을 추가했음에도 ERRO 발생 시 `scriptErrors`가 비어있어 Slack에 성공으로 발송됨

**원인**: k6 browser 모듈에서 발생하는 일부 에러(`page.$$()` 빈 배열 클릭 등)는 CDP(Chrome DevTools Protocol) 레이어에서 k6 런타임으로 올라오는 "Uncaught (in promise)"로 처리됨. 이 에러는 JS의 `try/catch`를 우회하기 때문에 catch 블록이 실행되지 않음

**이중 감지 구조로 해결**:
1. **JS 레벨** (`scriptErrors`): 일반 JS 예외는 `try/catch`로 수집 → `handleSummary`에서 스레드 발송
2. **Shell 레벨** (`run.sh`): k6 출력에서 `ERRO` 라인 감지 → CDP 에러 포함 전체 커버 → 별도 경고 Slack 발송 (주황색 구분)

**교훈**:
- k6 browser 에러는 JS try/catch만으로는 완전히 감지할 수 없음
- `run.sh` 레벨의 ERRO 감지를 반드시 함께 운영할 것

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

### React ESLint 경고 수정 패턴

**현상**: 빌드 경고가 여러 파일에 분산되어 누적됨

**수정 원칙 (우선순위 순)**:

1. **미사용 변수를 완전히 제거할 수 있으면 제거**
   - 구조분해에서 getter만 미사용 → `const [, setter] = useState(...)` 패턴으로 교체
   - 단순 대입 미사용 → 대입 제거 (`const response = await...` → `await ...`)
   - import에서 미사용 → import 목록에서 제거

2. **제거하면 로직 변경이 되는 경우 → `eslint-disable-next-line` 주석**
   - `useEffect` missing deps: 의도적 deps 배열인 경우 `// eslint-disable-next-line react-hooks/exhaustive-deps`
   - 미사용이지만 향후 사용 예정인 함수/변수: `// eslint-disable-next-line no-unused-vars`

3. **실제 코드 버그 수정**
   - `no-dupe-keys`: 중복 객체 키 → 하나 제거
   - `default-case`: switch에 `default: break` 추가

**교훈**:
- `useEffect` deps 경고를 억제할 때, 억제 이유를 주석으로 남기면 나중에 혼란 방지 (단, 이번 프로젝트는 간결함 우선으로 이유 주석 생략)
- 한 번에 여러 파일을 수정할 때 병렬 Read → 병렬 Edit 패턴으로 처리
- 빌드로 최종 검증 (`Compiled successfully.` 확인 필수)

---

### 업로드 모달 - 폴더 선택 드롭다운 추가 패턴

**배경**: 엑셀 업로드 시 `folder_id` 컬럼에만 의존하면 사용자가 업로드 시점에 폴더를 지정할 수 없음

**해결**:
- Frontend: 업로드 모달에 폴더 드롭다운 추가, `folder_id`를 FormData에 포함
- Backend: `request.form.get('folder_id')`로 수신, 엑셀 컬럼보다 우선 적용

**교훈**:
- 주석 처리된 state/훅(`allFolders`)은 필요 시 즉시 주석 해제 후 활용할 것
- FormData 전송 시 파일 외 추가 필드는 `formData.append(key, value)`로 붙임
- 모달 닫기/완료 시 추가한 state도 반드시 리셋할 것 (`setUploadFolderId('')`)

---

### Flask Blueprint route 충돌 감지

**현상**: 앱 기동 시 에러 없이 실행되지만 일부 엔드포인트가 예상과 다른 핸들러로 처리됨

**원인**: 두 Blueprint가 동일한 URL + method를 등록할 때, Flask는 먼저 등록된 것을 우선하고 나머지는 무시함 (에러 없음)

**감지 방법**:
```python
from app import app
with app.app_context():
    rules = [(str(r), r.endpoint) for r in app.url_map.iter_rules()]
    from collections import Counter
    counts = Counter(f"{r.methods} {str(r)}" for r in app.url_map.iter_rules())
    for url, count in counts.items():
        if count > 1:
            print(f"충돌: {url}")
```

**교훈**:
- Blueprint를 추가하면 반드시 전체 route 충돌 검사를 실행할 것
- 기존 Blueprint와 동일 URL을 등록하는 신규 Blueprint는 에러 없이 묻힘 → 침묵 버그
- `url_prefix`가 없는 Blueprint는 다른 Blueprint와 충돌 가능성이 높음

---

### CORS `supports_credentials=True` + wildcard origin 충돌

**현상**: 브라우저 콘솔에 `The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*' when credentials mode is 'include'` 오류

**원인**: `Flask-CORS`에서 `supports_credentials=True`와 `origins="*"` 동시 사용 불가. 브라우저 스펙상 wildcard + credentials 조합 금지.

**수정**: 프로덕션에서는 `origins` 명시적 목록 지정. 개발 환경에서는 `supports_credentials=False`로 유지.

---

### SQLAlchemy 2.0 - `Model.query.get()` deprecation

**현상**: SQLAlchemy 2.0에서 `Model.query.get(id)` 사용 시 deprecation warning 또는 에러

**수정**: `db.session.get(Model, id)`로 교체
```python
# 이전 (deprecated)
user = User.query.get(user_id)

# 신규 (SQLAlchemy 2.0+)
user = db.session.get(User, user_id)
```

**일괄 치환**: Python regex로 자동화 가능
```python
re.sub(r'(\w+)\.query\.get\((.+?)\)', r'db.session.get(\1, \2)', code)
```

---

### 백엔드 인증 누락 패턴

**현상**: 인증 없이 민감 데이터 조회 가능. 프론트엔드 동작은 정상처럼 보임.

**체크리스트**:
- 공개 읽기가 허용된 엔드포인트 → `@guest_allowed`
- 로그인 필요 엔드포인트 → `@login_required` 또는 `@user_required`
- 관리자 전용 엔드포인트 → `@admin_required`
- `/init-db`, `/db-status` 등 인프라 엔드포인트 → 반드시 `@admin_required`

**교훈**: 신규 Blueprint 파일 작성 시 각 route에 데코레이터 누락 여부를 먼저 확인할 것

---

### Jira 코드 검수 — 재발 방지 패턴

**프론트엔드 API 호출 인증 헤더**
- 신규 컴포넌트 작성 시 `const { user, token } = useAuth()` + `const authHeader = ...` 선언을 가장 먼저 할 것
- 같은 파일에서 컴포넌트마다 인증 헤더 적용 여부를 각각 확인할 것 (JiraConfigPanel은 있는데 JiraIssuesList는 없는 케이스 발생)

**백엔드 신규 Blueprint 체크리스트**
- 시스템 설정 변경 엔드포인트(POST/PUT) → `@admin_required`
- 조회 전용이라도 인증 없이 노출 금지 → `@user_required` 최소 적용
- health check, init-db 등 인프라 엔드포인트도 인증 필요

**datetime 일관성**
- 프로젝트 전체 `get_kst_now()` 사용 → 신규 코드에 `datetime.utcnow()` 절대 금지
- `from utils.timezone_utils import get_kst_now` 만 import하면 실수 방지

**데드코드 방지**
- `eslint-disable-next-line no-unused-vars`로 억압된 함수는 제거 대상 신호
- 해당 함수가 여는 modal state도 함께 제거 대상인지 확인할 것

**JSON.parse 방어**
- DB에서 온 JSON 컬럼(labels 등)은 렌더 중 직접 `JSON.parse()` 호출 금지
- `parseLabels()` 같은 try/catch 헬퍼로 감싸서 사용할 것

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

---

### HSAD 테스트 공통 모듈 정리 패턴

- HSAD Playwright/K6에서 루트 `url_base_hsad.js`와 `util/url_base_hsad.js`를 동시에 구현하면 URL/selector drift가 생긴다.
- 루트 파일은 `util/url_base_hsad.js`를 재수출하고, 실제 구현은 `util` 한 곳에서만 관리한다.
- selector는 URL 파일에 두지 않고 `selector_hsad.js`처럼 별도 파일로 분리한다. FE `test-tid`가 늘어날수록 URL/selector가 섞이면 검색과 유지보수가 어려워진다.
- k6 `check()`에는 Promise를 직접 반환하지 말고, `await locator.isVisible()` 결과를 boolean 변수로 만든 뒤 전달한다.
- Playwright config의 `testDir`가 `tests`만 가리키면 `HSAD/**/*.spec.js`는 수집되지 않으므로 `testMatch` 또는 전용 실행 스크립트를 함께 추가한다.
- TC 매트릭스의 `LC_001~LC_010` 같은 범위를 테스트명에 쓰면 해당 범위의 각 LC assertion을 실제로 포함해야 한다. smoke 수준이면 테스트명을 실제 LC 번호로 줄인다.

---

### Flask auth_decorators - 현재 유저 ID 접근 방법

**현상**: `g.current_user`로 접근하면 None 반환

**원인**: `auth_decorators.py`의 `_attach_request_auth`는 `request.current_user_id`와 `request.user`에 저장함. `flask.g`가 아님.

**패턴**:
```python
def _get_current_user_id():
    uid = getattr(request, 'current_user_id', None)
    if uid is not None:
        try:
            return int(uid)
        except (TypeError, ValueError):
            pass
    return None
```

---

### AI 대화형 TC 엔드포인트 - response_format json_object 사용 불가

**현상**: 대화형 엔드포인트는 json_object 강제 시 JSON만 반환 → 일반 텍스트 응답 불가

**해결**: 대화형 엔드포인트는 `response_format` 미설정. 응답에서 ` ```json ``` ` 블록만 파싱. 스펙 추출처럼 JSON만 필요한 경우는 `response_format: json_object` 유지.

---

### AI 멀티 공급자 통합 - 공급자별 API 차이점

**OpenAI**: `messages` 배열에 `{"role": "system", ...}` 포함 가능, `response_format: json_object` 지원

**Anthropic**: `system`은 별도 최상위 필드. `messages`는 user/assistant 교대로만 가능 (user로 시작해야 함). 같은 역할 연속 시 에러 → 필터링 필요.

**Google Gemini**: role이 `user`/`model` (assistant 아님). `system_instruction`이 별도 최상위 필드. URL에 API 키를 쿼리 파라미터로 전달 (`?key=...`).

**패턴**: 공급자별 함수 분리(`_call_openai`, `_call_anthropic`, `_call_google`) 후 `_call_ai_api()` 헬퍼로 통합. 사용자 설정 우선 → 서버 env fallback.

---

### API 키 저장 - 보안 패턴

- DB에 저장된 API 키는 GET 응답 시 반드시 마스킹 (`앞8자...뒤4자`)
- PUT 시 빈 문자열이면 기존 키 유지 (덮어쓰기 방지)
- 별도 `clear-key` 엔드포인트로 명시적 삭제만 허용

---

## 2026-05-14

### fullscreen-modal → SlidePanel 교체 패턴

모달을 SlidePanel로 교체할 때 두 번의 Edit으로 나눠서 처리:
1. **상단**: `modal-overlay` + `modal-header` 제거 → `<SlidePanel isOpen=... onClose=... title=...>` + `{children && (<>` 로 교체
2. **하단**: 남은 `</div></div>)}` (overlay 닫기들) → `</></SlidePanel>` 로 교체
3. `modal-body` 감싸는 div가 있으면 별도로 제거할 것 (orphan `</div>` 생김 주의)

---

### CSS selector 범위 — 컴포넌트 교체 시 적용 안 되는 문제

`.modal-overlay .modal-actions`처럼 특정 컨텍스트에 묶인 selector는 컴포넌트 구조가 바뀌면 적용되지 않는다.
- 교체 후 selector에서 중간 컨텍스트(`.modal-overlay`) 제거 필요
- 컴포넌트 교체 후 반드시 CSS selector 유효성 재확인

---

### SlidePanel — width는 CSS에서 관리

JS props(`width={600}`)로 고정 픽셀을 전달하면 반응형 통일이 어렵다.
- `SlidePanel.css`에서 `width: 50vw; min-width: 400px`로 CSS 레벨에서 관리
- JS에서 width prop 제거, 예외적인 크기는 CSS 클래스로 처리

---

### `@media (prefers-color-scheme: dark)` — 앱 전체 다크 모드 미지원 시 금지

앱이 다크 모드를 지원하지 않는데 특정 컴포넌트에만 `prefers-color-scheme: dark` 쿼리가 있으면, OS/브라우저 설정에 따라 해당 컴포넌트만 배경이 바뀌어 흰색/검은색으로 달라 보인다.
- 앱 전체 다크 모드 지원 전까지 개별 컴포넌트에 dark 미디어 쿼리 추가 금지

---

### box-shadow 일괄 제거 시 transition 참조도 함께 정리

`box-shadow:` 속성을 제거해도 `transition: border-color 0.15s, box-shadow 0.15s;`처럼 transition에 섞인 참조가 남는다.
- `/box-shadow:/d` 로 속성 줄 제거 후, `grep -rn "box-shadow"` 로 transition 잔여 참조 확인 및 제거

