# Lessons Learned

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
