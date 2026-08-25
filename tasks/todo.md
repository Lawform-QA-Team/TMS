# Task: AWS 이관 계획

## 배경
- 기존: Python Flask 백엔드 + React 프론트엔드 → Vercel 배포
- 신규: TypeScript Hono 서버 (`server/`) + React 프론트엔드 → AWS 운영
- Python `backend/`는 미사용, `server/`가 실제 백엔드

## 최종 아키텍처 목표

```
[ Route 53 ]
     |
     +-- frontend.도메인  -->  [ CloudFront ] --> [ S3 (정적 빌드) ]
     |
     +-- api.도메인       -->  [ ALB (WebSocket 지원) ]
                                    |
                              [ ECS Fargate ]
                              (server/ Docker 컨테이너)
                                    |
                    +---------------+---------------+
               [ RDS PostgreSQL ]       [ ElastiCache Redis ]
```

---

## Phase 1: 사전 준비 (코드 작업)

### 1-1. server/ 컨테이너화
- [x] `server/Dockerfile` 작성 (멀티스테이지 빌드: build → runtime)
- [x] `server/.dockerignore` 작성
- [x] `server/` 로컬 Docker 빌드 검증 (`docker build`) — 성공, 이미지 470MB
- [x] `server/` 로컬 Docker 실행 검증 — ECS Fargate에서 정상 기동 확인으로 대체

### 1-2. 환경변수 정리
- [x] `server/.env.example` 기준 AWS 환경변수 목록 확정 (env.ts에서 검증됨)
  - `DATABASE_URL` (RDS PostgreSQL)
  - `REDIS_URL` (ElastiCache)
  - `JWT_SECRET_KEY`
  - `ANTHROPIC_API_KEY`
  - `JIRA_*` 관련 키
  - `SLACK_*` 관련 키
  - `ALLOWED_ORIGINS`
- [x] `frontend/src/config.js` prod URL 하드코딩 제거 → `REACT_APP_API_URL` 환경변수만 사용

### 1-3. CI/CD 재작성 준비
- [x] 기존 `.github/workflows/deploy.yml` (Vercel 기준) → `deploy.vercel.yml.bak` 보관
- [x] `deploy-server.yml` 작성 — vitest → ECR push → ECS 롤링 배포
- [x] `deploy-frontend.yml` 작성 — 빌드(env 주입) → S3 sync → CloudFront 무효화

---

## Phase 2: AWS 인프라 구성 (콘솔, 서울 리전)

> 조건: 도메인 없음 (ALB DNS / CloudFront 기본 도메인 사용), 데이터 이관 없음

### 2-1. IAM 사전 준비
- [ ] GitHub Actions용 IAM 사용자 생성 — 본인 계정 액세스 키 사용으로 스킵
- [x] ECS Task 실행용 IAM Role 생성 (`tms-ecs-task-role`)
  - 정책: Secrets Manager 읽기 (`secretsmanager:GetSecretValue`)
  - 정책: CloudWatch Logs 쓰기

### 2-2. 네트워크 (VPC)
- [x] VPC 생성 — `TMS-vpc`
- [x] 퍼블릭 서브넷 2개 (ap-northeast-2a, 2c)
- [x] 프라이빗 서브넷 2개 (ap-northeast-2a, 2c)
- [x] Internet Gateway + NAT Gateway
- [x] 라우팅 테이블
- [x] Security Group 4개 생성
  - `tms-alb-sg` ✅
  - `tms-ecs-sg` ✅
  - `tms-rds-sg` ✅
  - `tms-redis-sg` ✅

### 2-3. 비밀 관리 (Secrets Manager)
- [x] 시크릿 생성 — `tms/production`
- [x] `DATABASE_URL` 업데이트 (RDS 엔드포인트)
- [x] `REDIS_URL` 업데이트 (rediss:// — TLS 활성화)

### 2-4. 데이터베이스 (RDS PostgreSQL)
- [x] RDS PostgreSQL 18.3 생성 (db.t4g.micro, tms-db)
  - DB 이름: `tms`, 사용자: `tms_user`
  - SG: `tms-rds-sg`, 퍼블릭 액세스: 아니오
- [x] RDS 엔드포인트 → Secrets Manager `DATABASE_URL` 업데이트

### 2-5. Redis (ElastiCache)
- [x] ElastiCache Redis OSS 생성 (cache.t4g.micro, tms-redis)
  - 노드 기반 캐시, 전송 중 암호화 활성화 (rediss://)
  - 서브넷 그룹: 프라이빗 서브넷 2개
- [x] 보안 그룹 tms-redis-sg 설정
- [x] 엔드포인트 → Secrets Manager `REDIS_URL` 업데이트
  - SG: `tms-redis-sg`
  - 클러스터 모드: 비활성화
- [x] ElastiCache 엔드포인트 확인 후 Secrets Manager `REDIS_URL` 업데이트

### 2-6. 컨테이너 레지스트리 (ECR)
- [x] ECR → 레포지터리 생성
  - 이름: `tms-server`
  - 가시성: 프라이빗
  - 이미지 스캔: 활성화
- [x] amd64 플랫폼으로 이미지 빌드 후 ECR 푸시 완료 (`--platform linux/amd64`)

### 2-7. 로드밸런서 (ALB)
- [x] EC2 → 로드밸런서 → ALB 생성
  - 이름: `tms-alb`
  - 체계: 인터넷 경계
  - VPC: tms-vpc, 퍼블릭 서브넷 2개 선택
  - SG: `tms-alb-sg`
- [x] Target Group 생성
  - 이름: `tms-server-tg`
  - 대상 유형: IP (Fargate용)
  - 포트: 8000, 프로토콜: HTTP
  - 헬스 체크: `GET /health`
- [x] ALB 리스너: HTTP 80 → tms-server-tg
- [x] ALB idle timeout: 300초로 변경 (WebSocket 대비, 기본 60s)
- [x] ALB DNS 주소 메모: `tms-alb-1949000332.ap-northeast-2.elb.amazonaws.com`

### 2-8. 컨테이너 서비스 (ECS)
- [x] ECS → 클러스터 생성
  - 이름: `ecs-tms-cluster` (개발팀 네이밍 규칙)
  - 인프라: AWS Fargate
- [x] ECR에 초기 이미지 수동 푸시 완료
- [x] Task Definition 생성
  - 이름: `tms-server`
  - 시작 유형: Fargate
  - CPU: 512, Memory: 1024
  - Task Role: `tms-ecs-task-role`
  - 컨테이너: 포트 8000, Secrets Manager valueFrom, CloudWatch Logs `/ecs/tms-server`
  - ※ ECS는 퍼블릭 서브넷 배치 (NAT Gateway 없음, 사내 솔루션)
- [x] ECS Service 생성
  - 이름: `tms-server-service`
  - 시작 유형: Fargate
  - 태스크 수: 1
  - 네트워크: 퍼블릭 서브넷 2개, SG: `tms-ecs-sg`
  - 로드밸런서: `tms-alb` → `tms-server-tg`
- [x] DATABASE_URL 특수문자 URL 인코딩 수정 (비밀번호 `#`→`%23`, `+`→`%2B`, `(`→`%28`)
  - 수정 후 Secrets Manager 업데이트 → 새 배포 강제 실행 필요

### 2-9. 프론트엔드 (S3 + CloudFront)
- [x] S3 버킷 생성
  - 이름: `lawform.tms-frontend`
  - 리전: ap-northeast-2
  - 퍼블릭 액세스 차단: 유지 (CloudFront OAC로 접근)
- [x] CloudFront Distribution 생성
  - Origin: S3 버킷 (OAC 방식, CloudFront가 S3 버킷 정책 자동 업데이트)
  - 기본 루트 객체: `index.html`
  - SPA 라우팅 에러 페이지: 403/404 → `/index.html` (200 응답)
  - 요금제: Free
- [x] CloudFront 도메인 확인
  - 도메인: `d1xo0n7wg4djpw.cloudfront.net`
  - 배포 ID: `E1NYWCIP3ZLC8Q`

### 2-10. DB 스키마 마이그레이션
- [x] ECS 태스크가 정상 기동된 것 확인 (`/health` 응답) — DB connected 확인
- [x] 마이그레이션 전용 ECS 태스크 실행 (1회성)
  ```bash
  # ECS Run Task — 커맨드 오버라이드
  command: ["npx", "prisma", "migrate", "deploy", "--schema=prisma/schema.prod.prisma"]
  ```
  또는 로컬에서 RDS에 직접 연결 가능한 경우:
  ```bash
  DATABASE_URL=postgresql://... npx prisma migrate deploy --schema=prisma/schema.prod.prisma
  ```

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

## Phase 3: CI/CD 파이프라인 구성

### 3-1. GitHub Actions — 백엔드 (server/)
- [x] `.github/workflows/deploy-server.yml` 작성 및 배포 성공
  - 트리거: `main` 브랜치 push + `server/**` 경로 변경
  - vitest → ECR push → ECS 롤링 배포
- [x] GitHub Secrets 등록 완료
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

### 3-2. GitHub Actions — 프론트엔드 (frontend/)
- [x] `.github/workflows/deploy-frontend.yml` 작성 및 배포 성공
  - 트리거: `main` 브랜치 push + `frontend/**` 경로 변경
  - 빌드(env 주입) → S3 sync → CloudFront 무효화
- [x] GitHub Secrets 등록 완료
  - `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `REACT_APP_API_URL`, `REACT_APP_UPLOAD_URL`

---

## Phase 4: 데이터 이관 (DB 마이그레이션)

- [x] 현재 DB 데이터 현황 파악 → 신규 운영 시작으로 결정, 이관 불필요
- [x] RDS PostgreSQL 스키마 마이그레이션 — schema.prod.prisma ECS 태스크로 배포 완료
- [x] 기존 데이터 이관 결정 — 빈 DB로 신규 운영 시작
- [x] 초기 Admin 계정 시딩 — 완료

---

## Phase 5: 검증 및 전환

- [x] ECS 서비스 헬스 체크 통과 확인 (`/health`) — {"status":"healthy","database":{"status":"connected"}}
- [x] 백엔드 주요 API 동작 확인 (auth, testcases) — HTTP 200 응답 확인
- [x] Socket.io WebSocket 연결 확인 — upgrades:["websocket"] 응답 확인
- [x] BullMQ 워커 동작 확인 — ECS 로그에서 "Jira pipeline worker 시작", "실행 엔진 worker 시작" 확인
- [x] 프론트엔드 CloudFront 접근 확인 — d1xo0n7wg4djpw.cloudfront.net HTTP 200 확인
- [x] 프론트엔드 → 백엔드 API 연결 확인 (CORS) — API 정상 응답 확인
- [x] Vercel 서비스 종료 — 완료

---

## 참고 사항

- `server/prisma/schema.prisma`: MySQL (dev 환경)
- `server/prisma/schema.prod.prisma`: PostgreSQL (prod 환경, AWS RDS 타겟)
- `frontend/src/config.js`: `REACT_APP_API_URL` 환경변수로 prod URL 주입
- `server/src/index.ts`: BullMQ 워커 2개(JiraPipeline, ExecutionEngine) + Socket.io 동시 기동
- WebSocket은 ALB 기본 지원, idle timeout 기본값(60s) 조정 필요할 수 있음

---

# Task: TestCaseTable buggle 스타일 리디자인

## 구현 목록

- [x] lib/qaPlanGenerator.ts — Claude API로 QA Plan JSON 생성
- [x] lib/slackNotifier.ts — Slack Bot API (fetch 기반, 승인 버튼 메시지)
- [x] lib/jiraPipeline.ts — collect-complete 케이스에서 qaplan 생성 연결
- [x] routes/slack.ts — POST /slack/interaction (승인/거절 처리)
- [x] routes/index.ts — slackRouter 등록
- [x] 프론트엔드 PipelineDetail — qaplan 단계 + planContent 표시
- [x] 검증 — webhook → Claude API → QAPlan DB 저장 → pipelineStatus=qaplan 확인
