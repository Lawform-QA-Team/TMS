# KT-CS 로그인→편집기 k6 부하 테스트

## 파일 구성

- `kt-cs-editor-load-test.js` — 메인 k6 스크립트 (단일 시나리오, VU당 5단계 순차 실행)
- `accounts.sample.csv` — 계정 CSV 포맷 예시 (5행). **실제 9,500건 CSV로 교체 필요**
- `sample.pdf` — cfs/save 멀티파트 업로드용 더미 파일. 실제 문서로 교체 권장
- `common/utils.js`, `common/slack_helper.js` — 결과 출력용 공통 헬퍼 (삼성전자 프로젝트 스크립트와 동일한 handleSummary 패턴을 재현). 원본 구현을 갖고 있다면 이 두 파일을 원본으로 교체해도 무방합니다 (함수 시그니처만 맞으면 됨).

## 실행 전 준비물

1. **계정 CSV** — `email,password,cfs_id` 헤더, 9,500행. `cfs_id`를 비워두면 스크립트가 `CFS_ID` 환경변수(기본 문서 1건)로 대체합니다. 여러 사용자가 동시에 같은 문서를 편집하는 상황을 원하는 게 아니라면, 계정별로 서로 다른 `cfs_id`를 배정하는 것을 권장합니다 (실사용 패턴에 더 가까움).
2. **BASE_URL** — 테스트 대상 서버 주소. 대전 내부망에 로드 제너레이터를 두고 실행하는 것을 권장합니다 (VPN 경유 시 VPN 구간이 새로운 병목이 될 수 있음).
3. k6 설치: [https://k6.io/docs/get-started/installation/](https://k6.io/docs/get-started/installation/)

## 실행 예시

```bash
# 본 실행 (9,500 VU까지 램프업)
k6 run \
  -e BASE_URL=https://staging.kt-cs.internal \
  -e ACCOUNTS_CSV=./accounts.csv \
  -e SAMPLE_FILE=./sample.pdf \
  kt-cs-editor-load-test.js

# 소규모 파일럿 (100~500명) — 본 실행 전 스크립트 검증용
k6 run \
  -e BASE_URL=https://staging.kt-cs.internal \
  -e ACCOUNTS_CSV=./accounts.sample.csv \
  -e SAMPLE_FILE=./sample.pdf \
  -e PEAK_VUS=50 \
  kt-cs-editor-load-test.js

```

## 실행 전 반드시 확인해야 할 것 (스크립트 내 TODO 참고)

- **로그인 인증 방식** (세션 쿠키 / Bearer 토큰 / SSO) — 스크립트는 쿠키·토큰 방식을 모두 시도하도록 만들어져 있지만, 실제 로그인 응답 바디의 필드명은 개발팀 확인 후 `extractAuthHeaders()` 함수를 수정해야 합니다.
- `is_mobile`(1|2), `is_gld`, `auth_result`, `attemptCount` 필드의 정확한 의미/기대값
- `/api/polaris/cfs/get`, `/update/editmode`, `/save` 요청 바디에 `cfsId` 외 추가 필드가 있는지 (실제 프론트 요청을 네트워크 탭에서 캡처해 대조 권장)
- `cfs/save` 멀티파트 파일 필드명이 실제로 `file`인지

이 항목들은 실제 응답을 받기 전까지는 가정값입니다. 파일럿 실행에서 401/400이 반복되면 이 목록부터 점검하세요.

## 단계 구성 (why)


| 단계                | 대응하는 API                                 | 비고                                 |
| ----------------- | ---------------------------------------- | ---------------------------------- |
| 01_login          | POST /api/login/email                    | DB 쿼리 5~8회, 신규기기 알림 발송 가능 — 로그인 병목 |
| 02_cfs_get        | POST /api/polaris/cfs/get                | 편집기 데이터 로드                         |
| 03_editmode_enter | PUT /api/polaris/cfs/update/editmode (Y) | 편집 모드 진입                           |
| 04_cfs_save       | PUT /api/polaris/cfs/save                | multipart 저장, DB 트랜잭션+로그           |
| 05_editmode_exit  | PUT /api/polaris/cfs/update/editmode (N) | **S3 복사 동시 발생 — 병목 관찰 포인트**        |


각 단계는 k6 `group()`으로 분리되어 있어 `group_duration{group:::05_editmode_exit}` 같은 태그로 단계별 응답시간을 따로 볼 수 있습니다. 5단계(편집 종료)가 다른 단계 대비 유독 느려지거나 에러율이 오르면 S3 스로틀링을 의심하고 시작하면 됩니다.

램프업은 100 → 500 → 1,000 → 3,000 → 9,500 순으로 걸려 있습니다(기존 실행계획 문서 기준). `PEAK_VUS` 환경변수로 최종 목표 동접을 낮춰서 파일럿을 먼저 돌려본 뒤 본 실행을 권장합니다.

## 결과 확인

- `http_req_failed` — 전체 에러율
- `kt_flow_success_rate` — 5단계 전체 완주 성공률
- `checks` — 개별 check(check()) 성공률, 전체 임계값 `rate>=0.95`
- `kt_login_duration`, `kt_cfs_get_duration`, `kt_editmode_enter_duration`, `kt_cfs_save_duration`, `kt_editmode_exit_duration` — 단계별 응답시간 Trend
- 콘솔 로그: 각 단계마다 `[VU123] step_name status durationms` 형식으로 출력

임계값(thresholds)은 실제 SLA가 확정되기 전 임시값입니다. SLA 확정 후 `options.thresholds`를 조정하세요.

## 결과 출력 / 리포트 / 슬랙 알림

테스트 종료 시 `handleSummary()`가 실행되어:

- `Result/kt_cs_editor_flow_<타임스탬프>.html` — k6-reporter HTML 리포트
- `Result/kt_cs_editor_flow_<타임스탬프>.json` — 원본 요약 데이터(JSON)

를 생성합니다. `Result/` 폴더는 `k6 run`을 실행하는 디렉토리 기준 상대경로로 생성되니, 실행 위치를 통일해두는 것을 권장합니다.

**슬랙 알림**은 `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID` 두 환경변수가 모두 설정된 경우에만 발송됩니다.

```bash
k6 run \
  -e BASE_URL=https://staging.kt-cs.internal \
  -e ACCOUNTS_CSV=./accounts.csv \
  -e SAMPLE_FILE=./sample.pdf \
  -e SLACK_BOT_TOKEN=xoxb-... \
  -e SLACK_CHANNEL_ID=C0123456789 \
  kt-cs-editor-load-test.js

```

동작 방식(삼성전자 프로젝트 스크립트와 동일):

1. 테스트 종료 후 `buildK6SummaryMessage()`로 상태(🟢/🔴)·최대 VU·이터레이션 수· checks 성공률·HTTP 실패율·응답시간 평균/p95를 담은 요약 메시지를 채널에 발송
2. 실행 중 수집된 `scriptErrors`가 1건이라도 있으면, 같은 스레드에 에러 상세 내역(`buildK6ErrorThreadBlocks()`)을 이어서 발송

⚠️ **알려진 한계**: k6는 VU마다 독립된 JS 실행 컨텍스트를 쓰기 때문에, 모듈 최상단에 선언한 `scriptErrors` 배열은 VU 간에 공유되지 않습니다. 9,500 VU 규모 실행에서는 이 배열이 전체 실패 건수를 다 담지 못할 수 있습니다 — 이건 원본 삼성전자 스크립트도 동일하게 갖고 있던 구조적 한계입니다. **정확한 전체 실패 건수는** `kt_flow_errors`**(Counter, 모든 VU에서 자동 집계)나** `checks`**/** `http_req_failed` **같은 k6 내장 집계 메트릭으로 확인하세요.** 슬랙 에러 스레드는 "에러가 있었다"는 신호와 일부 샘플 로그로만 참고하는 용도로 쓰는 걸 권장합니다.