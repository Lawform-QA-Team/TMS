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
- [ ] `server/` 로컬 Docker 실행 검증 — DB/Redis 준비 후 Phase 2에서 진행

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
- [ ] GitHub Actions용 IAM 사용자 생성
  - 정책: ECR 전체 + ECS 배포 + S3 sync + CloudFront 무효화
  - Access Key 발급 → GitHub Secrets 등록 예정
- [ ] ECS Task 실행용 IAM Role 생성 (`tms-ecs-task-role`)
  - 정책: Secrets Manager 읽기 (`secretsmanager:GetSecretValue`)
  - 정책: CloudWatch Logs 쓰기

### 2-2. 네트워크 (VPC)
- [ ] VPC 생성 — CIDR: `10.0.0.0/16`, 이름: `tms-vpc`
- [ ] 퍼블릭 서브넷 2개 (가용영역 a, c) — ALB 배치
  - `10.0.1.0/24` (ap-northeast-2a)
  - `10.0.2.0/24` (ap-northeast-2c)
- [ ] 프라이빗 서브넷 2개 (가용영역 a, c) — ECS, RDS, Redis 배치
  - `10.0.11.0/24` (ap-northeast-2a)
  - `10.0.12.0/24` (ap-northeast-2c)
- [ ] Internet Gateway 생성 → VPC 연결
- [ ] NAT Gateway 생성 (퍼블릭 서브넷 a) + Elastic IP
- [ ] 라우팅 테이블
  - 퍼블릭: 0.0.0.0/0 → Internet Gateway
  - 프라이빗: 0.0.0.0/0 → NAT Gateway
- [ ] Security Group 4개 생성
  - `tms-alb-sg`: 인바운드 80 전체 허용
  - `tms-ecs-sg`: 인바운드 8000 from tms-alb-sg 만
  - `tms-rds-sg`: 인바운드 5432 from tms-ecs-sg 만
  - `tms-redis-sg`: 인바운드 6379 from tms-ecs-sg 만

### 2-3. 비밀 관리 (Secrets Manager)
- [ ] 시크릿 생성 — 이름: `tms/production`, 타입: Other
  ```
  DATABASE_URL         = postgresql://...@rds엔드포인트:5432/tms
  JWT_SECRET_KEY       = (랜덤 32자 이상)
  REDIS_URL            = redis://elasticache엔드포인트:6379
  ANTHROPIC_API_KEY    = (선택)
  JIRA_SERVER_URL      = (선택)
  JIRA_USERNAME        = (선택)
  JIRA_API_TOKEN       = (선택)
  JIRA_WEBHOOK_SECRET  = (선택)
  JIRA_CRON_ENABLED    = false (Jira 폴링 사용 시 true)
  JIRA_CRON_JQL        = (선택, JIRA_CRON_ENABLED=true 시)
  SLACK_WEBHOOK_URL    = (선택)
  SLACK_BOT_TOKEN      = (선택)
  SLACK_CHANNEL_ID     = (선택)
  TEST_APP_BASE_URL    = (선택, 페이지 분석 대상 앱 URL)
  PLAYWRIGHT_ENABLED   = false
  ALLOWED_ORIGINS      = https://CloudFront도메인
  ```
  > RDS/ElastiCache 엔드포인트는 생성 후 채워 넣기

### 2-4. 데이터베이스 (RDS PostgreSQL)
- [ ] RDS → PostgreSQL 16 생성
  - 템플릿: 프리 티어 (개발/초기) 또는 프로덕션
  - 인스턴스: `db.t4g.micro` (초기)
  - DB 이름: `tms`, 사용자: `tms_user`
  - 서브넷 그룹: 프라이빗 서브넷 2개로 생성
  - SG: `tms-rds-sg`
  - 퍼블릭 액세스: 아니오
  - 자동 백업: 활성화 (보존 7일)
- [ ] RDS 엔드포인트 확인 후 Secrets Manager `DATABASE_URL` 업데이트

### 2-5. Redis (ElastiCache)
- [ ] ElastiCache → Redis OSS 생성
  - 배포 옵션: 단일 노드 (Serverless 아닌 일반)
  - 노드 유형: `cache.t4g.micro`
  - 서브넷 그룹: 프라이빗 서브넷 2개로 생성
  - SG: `tms-redis-sg`
  - 클러스터 모드: 비활성화
- [ ] ElastiCache 엔드포인트 확인 후 Secrets Manager `REDIS_URL` 업데이트

### 2-6. 컨테이너 레지스트리 (ECR)
- [ ] ECR → 레포지터리 생성
  - 이름: `tms-server`
  - 가시성: 프라이빗
  - 이미지 스캔: 활성화

### 2-7. 로드밸런서 (ALB)
- [ ] EC2 → 로드밸런서 → ALB 생성
  - 이름: `tms-alb`
  - 체계: 인터넷 경계
  - VPC: tms-vpc, 퍼블릭 서브넷 2개 선택
  - SG: `tms-alb-sg`
- [ ] Target Group 생성
  - 이름: `tms-server-tg`
  - 대상 유형: IP (Fargate용)
  - 포트: 8000, 프로토콜: HTTP
  - 헬스 체크: `GET /health`
- [ ] ALB 리스너: HTTP 80 → tms-server-tg
- [ ] ALB idle timeout: 300초로 변경 (WebSocket 대비, 기본 60s)
- [ ] ALB DNS 주소 메모 (프론트엔드 REACT_APP_API_URL에 사용)

### 2-8. 컨테이너 서비스 (ECS)
- [ ] ECS → 클러스터 생성
  - 이름: `tms-cluster`
  - 인프라: AWS Fargate
- [ ] ECR에 초기 이미지 수동 푸시 (Task Definition 등록 전 필요)
  ```bash
  aws ecr get-login-password --region ap-northeast-2 | \
    docker login --username AWS --password-stdin [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com
  docker tag tms-server:test [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/tms-server:latest
  docker push [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/tms-server:latest
  ```
- [ ] Task Definition 생성
  - 이름: `tms-server`
  - 시작 유형: Fargate
  - CPU: 512, Memory: 1024
  - Task Role: `tms-ecs-task-role`
  - 컨테이너
    - 이름: `tms-server`
    - 이미지: ECR 이미지 URI
    - 포트: 8000
    - 환경변수: Secrets Manager ARN 참조 방식으로 주입
      - `NODE_ENV` = `production` (값 직접 입력)
      - 나머지는 `tms/production` 시크릿에서 valueFrom으로 참조
    - 로그: CloudWatch Logs (`/ecs/tms-server`)
- [ ] ECS Service 생성
  - 이름: `tms-server-service`
  - 시작 유형: Fargate
  - 태스크 수: 1
  - 네트워크: 프라이빗 서브넷 2개, SG: `tms-ecs-sg`
  - 로드밸런서: `tms-alb` → `tms-server-tg`

### 2-9. 프론트엔드 (S3 + CloudFront)
- [ ] S3 버킷 생성
  - 이름: `tms-frontend-[계정ID]` (전역 고유)
  - 리전: ap-northeast-2
  - 퍼블릭 액세스 차단: 유지 (CloudFront OAC로 접근)
- [ ] CloudFront Distribution 생성
  - Origin: S3 버킷 (OAC 방식)
  - 기본 루트 객체: `index.html`
  - SPA 라우팅 에러 페이지: 403/404 → `/index.html` (200 응답)
  - 뷰어 프로토콜: HTTPS only
- [ ] CloudFront 도메인(*.cloudfront.net) 확인
  - GitHub Secrets `REACT_APP_API_URL` = ALB DNS
  - GitHub Secrets `ALLOWED_ORIGINS` (Secrets Manager) = CloudFront 도메인

### 2-10. DB 스키마 마이그레이션
- [ ] ECS 태스크가 정상 기동된 것 확인 (`/health` 응답)
- [ ] 마이그레이션 전용 ECS 태스크 실행 (1회성)
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
- [ ] `.github/workflows/deploy-server.yml` 작성
  - 트리거: `main` 브랜치 push + `server/**` 경로 변경
  - 단계:
    1. `vitest` 테스트 실행
    2. Docker 이미지 빌드
    3. ECR push (태그: `latest` + 커밋 SHA)
    4. ECS 태스크 정의 업데이트
    5. ECS Service 롤링 배포
- [ ] GitHub Secrets 등록
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
  - `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`, `ECS_TASK_DEFINITION`

### 3-2. GitHub Actions — 프론트엔드 (frontend/)
- [ ] `.github/workflows/deploy-frontend.yml` 작성
  - 트리거: `main` 브랜치 push + `frontend/**` 경로 변경
  - 단계:
    1. `REACT_APP_API_URL` 주입 후 프로덕션 빌드
    2. S3 sync (`aws s3 sync build/ s3://버킷명 --delete`)
    3. CloudFront 캐시 무효화 (`/*`)
- [ ] GitHub Secrets 등록
  - `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`
  - `REACT_APP_API_URL` (api.도메인)

---

## Phase 4: 데이터 이관 (DB 마이그레이션)

- [ ] 현재 DB 데이터 현황 파악 (MySQL `10.205.1.14` 또는 기타)
- [ ] RDS PostgreSQL에 `prisma migrate deploy --schema=prisma/schema.prod.prisma` 실행
- [ ] 기존 데이터 이관 필요 여부 결정
  - 신규 운영 시작: 마이그레이션 불필요, 빈 DB로 시작
  - 기존 데이터 보존: MySQL → PostgreSQL 데이터 변환 스크립트 작성
- [ ] 초기 Admin 계정 시딩

---

## Phase 5: 검증 및 전환

- [ ] ECS 서비스 헬스 체크 통과 확인 (`/health`)
- [ ] 백엔드 주요 API 동작 확인 (auth, testcases, dashboard)
- [ ] Socket.io WebSocket 연결 확인 (NotificationBell)
- [ ] BullMQ 워커 동작 확인 (Jira Pipeline, Execution Engine)
- [ ] 프론트엔드 CloudFront 접근 및 SPA 라우팅 확인
- [ ] 프론트엔드 → 백엔드 API 연결 확인 (CORS 포함)
- [ ] Vercel 서비스 종료 (backend-alpha, frontend)

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
