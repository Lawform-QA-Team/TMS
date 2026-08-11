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
