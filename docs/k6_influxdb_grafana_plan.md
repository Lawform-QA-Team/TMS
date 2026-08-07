# k6 성능 테스트 결과 - InfluxDB 저장 및 Grafana 대시보드 구성 계획서

## 1. 개요

k6 브라우저 성능 테스트(삼성 Real 환경)에서 수집한 각 동작별 응답 시간(Trend 메트릭)을 InfluxDB에 저장하고, Grafana 대시보드에서 시각화하기 위한 구성 계획입니다.

---

## 2. 수집 메트릭 목록

### 2.1 Admin - Login

| 메트릭 키 | 설명 |
|---|---|
| `page_load_duration` | 로그인 페이지 로드 시간 |
| `input_credentials_duration` | 이메일/비밀번호 입력 시간 |
| `submit_login_duration` | 로그인 버튼 클릭 후 응답 시간 |
| `total_login_duration` | 전체 로그인 플로우 시간 |

### 2.2 Admin - Dashboard

| 메트릭 키 | 설명 |
|---|---|
| `admin_dash_page_load` | 대시보드 페이지 로드 시간 |
| `admin_dash_search_filter` | 통계 필터 적용 + 조회 시간 |

### 2.3 Admin - Notice

| 메트릭 키 | 설명 |
|---|---|
| `admin_notice_page_load` | 공지사항 페이지 로드 시간 |
| `admin_notice_search` | 공지사항 검색 응답 시간 |
| `admin_notice_register_save` | 공지사항 등록 저장 시간 |
| `admin_notice_table_click` | 공지사항 테이블 클릭 응답 시간 |
| `admin_notice_edit_save` | 공지사항 수정 저장 시간 |

### 2.4 Admin - AI 채팅 데이터

| 메트릭 키 | 설명 |
|---|---|
| `admin_ai_chat_page_load` | AI 채팅 로그 페이지 로드 시간 |
| `admin_ai_chat_search` | AI 채팅 데이터 검색 시간 |
| `admin_ai_chat_table_click` | 테이블 클릭 응답 시간 |
| `admin_ai_chat_register_save` | 채팅 데이터 등록/저장 시간 |
| `admin_ai_chat_delete` | 채팅 데이터 삭제 시간 |
| `admin_ai_chat_preset_page_load` | 사전설정 채팅 페이지 로드 시간 |
| `admin_ai_chat_preset_search` | 사전설정 채팅 검색 시간 |
| `admin_ai_chat_preset_register_save` | 사전설정 채팅 등록/저장 시간 |
| `admin_ai_chat_preset_table_click` | 사전설정 채팅 테이블 클릭 시간 |
| `admin_ai_chat_preset_edit_save` | 사전설정 채팅 수정/저장 시간 |
| `admin_ai_chat_preset_delete` | 사전설정 채팅 삭제 시간 |

### 2.5 Admin - AI 외부 데이터

| 메트릭 키 | 설명 |
|---|---|
| `admin_ai_ext_page_load` | AI 외부 데이터(법령) 페이지 로드 시간 |
| `admin_ai_ext_search` | AI 외부 데이터 검색 시간 |
| `admin_ai_ext_table_click` | 테이블 클릭 응답 시간 |
| `admin_ai_ext_data_view` | 데이터 조회 시간 |
| `admin_ai_ext_delete` | 데이터 삭제 시간 |
| `admin_ai_ext_co_page_load` | AI 외부 데이터(타사) 페이지 로드 시간 |
| `admin_ai_ext_co_search` | 타사 문서 검색 시간 |
| `admin_ai_ext_co_register_save` | 타사 문서 등록/저장 시간 |
| `admin_ai_ext_co_table_click` | 타사 문서 테이블 클릭 시간 |
| `admin_ai_ext_co_detail` | 타사 문서 상세 조회 시간 |
| `admin_ai_ext_co_delete` | 타사 문서 삭제 시간 |

### 2.6 Admin - 표준 양식 관리 (Autodoc)

| 메트릭 키 | 설명 |
|---|---|
| `admin_autodoc_page_load` | 표준 양식 관리 페이지 로드 시간 |
| `admin_autodoc_search` | 표준 양식 검색 시간 |
| `admin_autodoc_register` | 표준 양식 등록 진입 시간 |
| `admin_autodoc_table_click` | 표준 양식 테이블 클릭 시간 |
| `admin_autodoc_cat_page_load` | 카테고리 관리 페이지 로드 시간 |
| `admin_autodoc_cat_search` | 카테고리 검색 시간 |
| `admin_autodoc_cat_register_save` | 카테고리 등록/저장 시간 |
| `admin_autodoc_cat_table_click` | 카테고리 테이블 클릭 시간 |
| `admin_autodoc_cat_edit_save` | 카테고리 수정/저장 시간 |
| `admin_autodoc_tool_page_load` | 표준 양식 도구 페이지 로드 시간 |

### 2.7 Admin - 문서 업데이트 리포트

| 메트릭 키 | 설명 |
|---|---|
| `admin_doc_update_page_load` | 문서 업데이트 리포트 페이지 로드 시간 |
| `admin_doc_update_date_select` | 날짜 선택 응답 시간 |
| `admin_doc_update_law_select` | 법령 선택 응답 시간 |
| `admin_doc_update_view_original` | 원문 보기 응답 시간 |
| `admin_doc_update_oth_page_load` | 타사문서 리포트 페이지 로드 시간 |
| `admin_doc_update_oth_date_select` | 타사문서 날짜 선택 시간 |
| `admin_doc_update_oth_company_select` | 기업 선택 응답 시간 |
| `admin_doc_update_oth_view_original` | 타사문서 원문 보기 응답 시간 |

### 2.8 Admin - Filtering / IP / Log / Members / QNA

| 메트릭 키 | 설명 |
|---|---|
| `admin_filtering_page_load` | 필터링 관리 페이지 로드 시간 |
| `admin_filtering_search` | 필터링 검색 시간 |
| `admin_filtering_register_save` | 필터링 등록/저장 시간 |
| `admin_filtering_table_click` | 필터링 테이블 클릭 시간 |
| `admin_filtering_edit_save` | 필터링 수정/저장 시간 |
| `admin_ip_page_load` | IP 관리 페이지 로드 시간 |
| `admin_ip_search` | IP 검색 시간 |
| `admin_log_page_load` | 로그 페이지 로드 시간 |
| `admin_log_date_select` | 로그 일시 설정 시간 |
| `admin_log_search` | 로그 검색 시간 |
| `admin_log_ai_chat` | 로그 AI 채팅 검색 시간 |
| `admin_members_page_load` | 사용자 관리(백오피스) 페이지 로드 시간 |
| `admin_members_search` | 사용자 검색 시간 |
| `admin_members_table_click` | 사용자 테이블 클릭 시간 |
| `admin_members_edit_save` | 사용자 정보 수정/저장 시간 |
| `admin_members_svc_page_load` | 사용자 관리(서비스) 페이지 로드 시간 |
| `admin_members_svc_search` | 서비스 사용자 검색 시간 |
| `admin_members_svc_table_click` | 서비스 사용자 테이블 클릭 시간 |
| `admin_members_svc_edit_save` | 서비스 사용자 수정/저장 시간 |
| `admin_members_svc_handover` | 인수인계 처리 시간 |
| `admin_qna_page_load` | 1:1 문의 관리 페이지 로드 시간 |
| `admin_qna_status_filter` | 1:1 문의 상태 필터 시간 |
| `admin_qna_search` | 1:1 문의 검색 시간 |
| `admin_qna_table_click` | 1:1 문의 테이블 클릭 시간 |
| `admin_qna_answer_save` | 1:1 문의 답변 저장 시간 |

### 2.9 Web - Login / Drive / Notice / QNA / Search / Autodoc

| 메트릭 키 | 설명 |
|---|---|
| `web_drive_page_load` | 문서 조회 페이지 로드 시간 |
| `web_drive_category_search` | 카테고리 검색 시간 |
| `web_drive_datepicker` | 등록일 날짜 선택 시간 |
| `web_drive_search` | 문서 조회 검색 시간 |
| `web_drive_table_click` | 문서 조회 테이블 클릭 시간 |
| `web_notice_page_load` | 공지사항 페이지 로드 시간 |
| `web_notice_search` | 공지사항 검색 시간 |
| `web_notice_table_click` | 공지사항 테이블 클릭 시간 |
| `web_notice_history` | 공지사항 수정이력 조회 시간 |
| `web_qna_page_load` | 1:1 문의 페이지 로드 시간 |
| `web_qna_status_filter` | 1:1 문의 상태 필터 시간 |
| `web_qna_search` | 1:1 문의 검색 시간 |
| `web_qna_register_save` | 1:1 문의 등록/저장 시간 |
| `web_qna_table_click` | 1:1 문의 테이블 클릭 시간 |
| `web_search_search` | 통합검색 시간 |
| `web_search_filter` | 통합검색 필터 적용 시간 |
| `web_search_result_click` | 통합검색 결과 클릭 시간 |
| `web_autodoc_page_load` | 문서 작성 페이지 로드 시간 |
| `web_autodoc_search` | 문서 작성 검색 시간 |
| `web_autodoc_table_click` | 문서 작성 테이블 클릭 시간 |
| `web_autodoc_draft_save` | 문서 임시저장 시간 |
| `web_autodoc_ai_labeling` | AI 자동 라벨링 처리 시간 |
| `web_autodoc_save` | 문서 저장 시간 |
| `web_autodoc_edit_save` | 문서 수정모드 저장 시간 |
| `web_autodoc_ai_chat` | AI 채팅 응답 시간 |
| `web_autodoc_auto_review` | AI 자동 검토 시간 |

---

## 3. InfluxDB 연동 설정

### 3.1 사전 요구사항

- InfluxDB v2.x 설치 및 실행
- bucket 생성: 예) `k6_performance`
- org 생성: 예) `tms`
- API token 발급

### 3.2 k6 실행 시 InfluxDB 출력 활성화

k6는 `--out influxdb` 옵션을 통해 InfluxDB v1.x로 직접 전송하거나, `xk6-output-influxdbv2` 확장을 사용해 v2.x로 전송합니다.

#### 방법 A: InfluxDB v1.x 사용 (기본 내장)

```bash
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  -e ADMIN_LOGIN_EMAIL=admin@example.com \
  -e ADMIN_LOGIN_PASSWORD=password \
  test-scripts/performance/samsung/real/admin/login/login_to_web.js
```

InfluxDB v1.x에서 database 생성:
```sql
CREATE DATABASE k6
```

#### 방법 B: InfluxDB v2.x 사용 (xk6 빌드 필요)

```bash
# xk6로 커스텀 k6 빌드
go install go.k6.io/xk6/cmd/xk6@latest
xk6 build --with github.com/grafana/xk6-output-influxdbv2

# 실행
./k6 run \
  --out xk6-influxdbv2=http://localhost:8086,token=<API_TOKEN>,org=tms,bucket=k6_performance \
  -e ADMIN_LOGIN_EMAIL=admin@example.com \
  -e ADMIN_LOGIN_PASSWORD=password \
  test-scripts/performance/samsung/real/admin/login/login_to_web.js
```

#### 방법 C: k6 Cloud / Grafana Cloud k6 사용 (권장)

```bash
k6 run \
  --out cloud \
  test-scripts/performance/samsung/real/admin/login/login_to_web.js
```

Grafana Cloud k6는 별도 InfluxDB 설정 없이 메트릭을 자동으로 저장합니다.

### 3.3 환경변수 정리

```bash
# .env 파일 예시
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=<your-api-token>
INFLUXDB_ORG=tms
INFLUXDB_BUCKET=k6_performance

# k6 실행 스크립트 예시
export K6_OUT="xk6-influxdbv2=${INFLUXDB_URL},token=${INFLUXDB_TOKEN},org=${INFLUXDB_ORG},bucket=${INFLUXDB_BUCKET}"
```

### 3.4 InfluxDB에 저장되는 데이터 구조

k6가 InfluxDB에 데이터를 쓸 때 각 Trend 메트릭은 다음 형식으로 저장됩니다:

```
measurement: k6_<metric_name>
tags:
  - scenario: ui
  - group: (테스트 그룹명)
  - check: (체크 이름, 있는 경우)
fields:
  - value: <응답 시간 ms>
timestamp: <Unix timestamp>
```

예시:
```
k6_admin_notice_search,scenario=ui value=523.4 1710000000000000000
k6_admin_notice_page_load,scenario=ui value=1205.7 1710000000000000000
```

---

## 4. Grafana 대시보드 구성 계획

### 4.1 데이터 소스 추가

1. Grafana 접속 → Configuration → Data Sources
2. InfluxDB 선택
3. 연결 정보 입력:
   - URL: `http://localhost:8086`
   - Query Language: `Flux` (v2.x) 또는 `InfluxQL` (v1.x)
   - Token / Auth 설정

### 4.2 대시보드 구성 (권장 패널 구조)

대시보드는 기능별 Row로 구분하고, 각 Row 내에 주요 메트릭별 패널을 배치합니다.

#### 대시보드 1: Admin 성능 대시보드

```
┌─────────────────────────────────────────────────────────┐
│ [Row] 로그인                                             │
│  ├── [Panel] 로그인 단계별 응답 시간 (Bar chart)         │
│  │   - page_load_duration, input_credentials_duration,  │
│  │     submit_login_duration, total_login_duration       │
│  └── [Panel] 로그인 응답 시간 추이 (Time series)        │
│                                                         │
│ [Row] 대시보드 / 공지사항                               │
│  ├── [Panel] 대시보드 페이지 로드 (Stat)                │
│  ├── [Panel] 대시보드 검색 필터 (Stat)                  │
│  ├── [Panel] 공지사항 액션별 응답 시간 (Bar chart)      │
│  └── [Panel] 공지사항 시계열 (Time series)              │
│                                                         │
│ [Row] AI 채팅 데이터                                    │
│  ├── [Panel] AI 채팅 로그 액션별 응답 시간 (Bar chart)  │
│  └── [Panel] AI 사전설정 채팅 액션별 응답 시간          │
│                                                         │
│ [Row] AI 외부 데이터                                    │
│  ├── [Panel] 법령 데이터 액션별 응답 시간               │
│  └── [Panel] 타사 문서 액션별 응답 시간                 │
│                                                         │
│ [Row] 표준 양식 관리 / 문서 업데이트                    │
│  ├── [Panel] Autodoc 액션별 응답 시간                   │
│  └── [Panel] 문서 업데이트 리포트 응답 시간             │
│                                                         │
│ [Row] 사용자 관리 / QNA / 필터링 / IP / 로그            │
│  ├── [Panel] 사용자 관리 응답 시간                      │
│  ├── [Panel] 1:1 문의 응답 시간                         │
│  ├── [Panel] 필터링 / IP / 로그 응답 시간               │
└─────────────────────────────────────────────────────────┘
```

#### 대시보드 2: Web 성능 대시보드

```
┌─────────────────────────────────────────────────────────┐
│ [Row] 문서 조회 / 통합검색                              │
│  ├── [Panel] 문서 조회 액션별 응답 시간 (Bar chart)     │
│  └── [Panel] 통합검색 액션별 응답 시간 (Bar chart)      │
│                                                         │
│ [Row] 공지사항 / 1:1 문의                               │
│  ├── [Panel] 공지사항 응답 시간 (Bar chart)             │
│  └── [Panel] 1:1 문의 응답 시간 (Bar chart)             │
│                                                         │
│ [Row] 문서 작성 (Autodoc)                               │
│  ├── [Panel] 문서 작성 단계별 응답 시간 (Bar chart)     │
│  │   - 검색, 테이블 클릭, 임시저장, AI 라벨링,          │
│  │     저장, 수정저장, AI 채팅, AI 자동검토             │
│  └── [Panel] AI 관련 작업 응답 시간 비교 (Bar chart)   │
└─────────────────────────────────────────────────────────┘
```

#### 대시보드 3: 전체 요약 대시보드

```
┌─────────────────────────────────────────────────────────┐
│ [Row] 전체 성능 요약                                    │
│  ├── [Panel] 각 스크립트 총 실행 시간 (Bar chart)       │
│  ├── [Panel] 페이지 로드 시간 비교 (Bar chart)          │
│  │   - 모든 *_page_load 메트릭 비교                    │
│  ├── [Panel] 검색 응답 시간 비교 (Bar chart)            │
│  │   - 모든 *_search 메트릭 비교                       │
│  └── [Panel] AI 관련 작업 응답 시간 비교 (Bar chart)   │
└─────────────────────────────────────────────────────────┘
```

### 4.3 패널 쿼리 예시 (InfluxDB v2.x / Flux)

#### 특정 메트릭의 최신 값 (Stat 패널)

```flux
from(bucket: "k6_performance")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "k6_admin_notice_search")
  |> filter(fn: (r) => r._field == "value")
  |> mean()
```

#### 여러 메트릭 평균값 비교 (Bar chart 패널)

```flux
measurements = ["k6_admin_notice_page_load", "k6_admin_notice_search",
                 "k6_admin_notice_register_save", "k6_admin_notice_table_click",
                 "k6_admin_notice_edit_save"]

union(tables: measurements |> array.map(fn: (x) =>
  from(bucket: "k6_performance")
    |> range(start: -24h)
    |> filter(fn: (r) => r._measurement == x)
    |> filter(fn: (r) => r._field == "value")
    |> mean()
    |> map(fn: (r) => ({r with _measurement: x}))
))
```

#### 시간별 메트릭 추이 (Time series 패널)

```flux
from(bucket: "k6_performance")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement =~ /^k6_admin_notice_/)
  |> filter(fn: (r) => r._field == "value")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> yield(name: "mean")
```

#### InfluxQL 쿼리 예시 (v1.x)

```sql
-- 평균 응답 시간
SELECT mean("value") FROM "k6_admin_notice_search" WHERE $timeFilter GROUP BY time($__interval) fill(null)

-- p95 응답 시간
SELECT percentile("value", 95) FROM "k6_admin_notice_search" WHERE $timeFilter GROUP BY time($__interval)
```

### 4.4 패널 타입 권장

| 용도 | 패널 타입 |
|---|---|
| 단일 메트릭 현재 값 표시 | **Stat** |
| 여러 메트릭 값 비교 | **Bar chart** |
| 시간에 따른 변화 추적 | **Time series** |
| 임계값 초과 여부 확인 | **Gauge** |
| 전체 테스트 결과 표 | **Table** |

### 4.5 임계값(Threshold) 설정 권장

응답 시간 기준 (Stat / Gauge 패널):

| 등급 | 색상 | 기준 |
|---|---|---|
| 정상 | 초록 | < 2000ms |
| 주의 | 노랑 | 2000ms ~ 5000ms |
| 경고 | 주황 | 5000ms ~ 10000ms |
| 위험 | 빨강 | > 10000ms |

AI 관련 작업 (ai_labeling, ai_chat, auto_review 등) 별도 기준:

| 등급 | 색상 | 기준 |
|---|---|---|
| 정상 | 초록 | < 10000ms |
| 주의 | 노랑 | 10000ms ~ 30000ms |
| 경고 | 빨강 | > 30000ms |

---

## 5. 실행 방법

### 5.1 단일 스크립트 실행 (InfluxDB 출력 포함)

```bash
# Admin Login 테스트
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  -e ADMIN_LOGIN_EMAIL=your@email.com \
  -e ADMIN_LOGIN_PASSWORD=yourpassword \
  test-scripts/performance/samsung/real/admin/login/login_to_web.js

# Web Search 테스트
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  -e WEB_LOGIN_EMAIL=your@email.com \
  -e WEB_LOGIN_PASSWORD=yourpassword \
  test-scripts/performance/samsung/real/web/search/search.js
```

### 5.2 전체 Admin 스크립트 일괄 실행 스크립트 예시

```bash
#!/bin/bash
BASE_PATH="test-scripts/performance/samsung/real/admin"
INFLUX_OUT="influxdb=http://localhost:8086/k6"

for script in \
  "login/login_to_web.js" \
  "dashboard/dashboard.js" \
  "notice/notice.js" \
  "ai_chat_data/ai_chat_data.js" \
  "ai_chat_data/ai_chat_data_preset.js" \
  "ai_external_data/ai_external_data.js" \
  "ai_external_data/ai_external_data_company.js" \
  "autodoc/autodoc.js" \
  "autodoc/autodoc_category.js" \
  "document_update_report/document_update_report.js" \
  "document_update_report/document_update_report_other.js" \
  "filtering/filtering.js" \
  "ip_management/ip_management.js" \
  "log/log.js" \
  "members/members.js" \
  "members/members_service.js" \
  "qna/qna_search.js"
do
  echo "Running: $BASE_PATH/$script"
  k6 run \
    --out "$INFLUX_OUT" \
    -e ADMIN_LOGIN_EMAIL="$ADMIN_EMAIL" \
    -e ADMIN_LOGIN_PASSWORD="$ADMIN_PASSWORD" \
    "$BASE_PATH/$script"
  sleep 2
done
```

### 5.3 전체 Web 스크립트 일괄 실행 스크립트 예시

```bash
#!/bin/bash
BASE_PATH="test-scripts/performance/samsung/real/web"
INFLUX_OUT="influxdb=http://localhost:8086/k6"

for script in \
  "drive/drive.js" \
  "notice/notice.js" \
  "qna/qna.js" \
  "search/search.js" \
  "autodoc/autodoc.js"
do
  echo "Running: $BASE_PATH/$script"
  k6 run \
    --out "$INFLUX_OUT" \
    -e WEB_LOGIN_EMAIL="$WEB_EMAIL" \
    -e WEB_LOGIN_PASSWORD="$WEB_PASSWORD" \
    "$BASE_PATH/$script"
  sleep 2
done
```

---

## 6. Docker Compose로 InfluxDB + Grafana 로컬 구성

```yaml
# docker-compose.yml
version: '3.8'

services:
  influxdb:
    image: influxdb:1.8
    container_name: influxdb
    ports:
      - "8086:8086"
    environment:
      - INFLUXDB_DB=k6
      - INFLUXDB_HTTP_AUTH_ENABLED=false
    volumes:
      - influxdb_data:/var/lib/influxdb

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - influxdb

volumes:
  influxdb_data:
  grafana_data:
```

실행:
```bash
docker-compose up -d
```

Grafana 접속: http://localhost:3000
InfluxDB 데이터 소스 URL: `http://influxdb:8086` (Docker 내부) 또는 `http://localhost:8086` (호스트에서)

---

## 7. 참고 사항

- k6 Trend 메트릭은 기본적으로 `min`, `max`, `avg`, `p(90)`, `p(95)` 통계를 제공합니다.
- `new Trend('metric_name', true)` 의 두 번째 인자 `true`는 밀리초(ms) 단위임을 나타냅니다.
- InfluxDB에 저장 시 measurement 이름은 `k6_` + 메트릭 이름 형식입니다.
- 테스트 실행마다 데이터가 누적되므로 Grafana에서 시간 범위 필터를 적절히 사용합니다.
- 공식 k6 Grafana 대시보드 템플릿 ID: **2587** (Grafana.com에서 임포트 가능)
