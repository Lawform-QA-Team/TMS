# Integrated Test Management System (TMS)

테스트 케이스 관리부터 Jira 연동 QA 자동화 파이프라인까지 통합 지원하는 웹 기반 테스트 플랫폼입니다.

---

## 주요 기능

- **테스트 케이스 관리** — 계층적 폴더(환경/배포일자/기능) 구조, CSV 다운로드, 일괄 이동/삭제
- **자동화 테스트** — Playwright 스크립트 관리 및 실행
- **성능 테스트** — K6 스크립트 관리, InfluxDB 연동, 메트릭 시계열 저장
- **QA 자동화 파이프라인** — Jira 이슈 수집 → AI(Claude) QA Plan 생성 → 슬랙 승인/반려/취소 → TC 자동 생성 → 코드 생성 → 실행 → 리포트
- **Jira 연동** — 웹훅/크론 기반 이슈 수집, TC 자동 생성, 상태 동기화
- **슬랙 연동** — QA Plan 승인 요청, 단계별 알림
- **대시보드 & 분석** — 실시간 테스트 통계, 차트, 커스텀 리포트
- **협업** — 댓글, 멘션, 실시간 알림 (Socket.io)
- **프로젝트/폴더 관리** — 프로젝트별 폴더 구조, 역할 기반 접근 제어
- **모니터링** — Playwright + K6 지속적 모니터링

---

## 기술 스택

### Backend
| 항목 | 기술 |
|------|------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Hono 4.6 |
| ORM | Prisma |
| Database | MySQL 8.0 |
| Cache / Queue | Redis + BullMQ |
| Auth | JWT (Jose) |
| Real-time | Socket.io |
| Logging | Pino |
| Validation | Zod |
| AI | Anthropic Claude SDK |

### Frontend
| 항목 | 기술 |
|------|------|
| Framework | React 19 |
| Build | Craco (CRA 커스텀) |
| HTTP | Axios |
| Charts | Chart.js |
| Editor | Monaco Editor |

### Testing
| 항목 | 기술 |
|------|------|
| 자동화 | Playwright |
| 성능 | K6 |
| 단위 테스트 | Vitest |

---

## 빠른 시작

### 사전 요구사항

- Node.js 20.12+
- MySQL 8.0+
- Redis 7+

---

### 1. 저장소 클론

```bash
git clone <repository-url>
cd TMS
```

---

### 2. 백엔드 설정

```bash
cd server
npm install
cp .env.example .env
```

`.env` 파일에서 필수 항목을 설정합니다 (아래 환경변수 섹션 참고).

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 새 DB인 경우 마이그레이션 실행
npm run db:migrate

# 개발 서버 실행
npm run dev
```

서버 상태 확인: `http://localhost:8000/health`

```json
{"status":"healthy","message":"TMS Server is running","version":"3.0.0","database":{"status":"connected"}}
```

---

### 3. 프론트엔드 설정

```bash
cd frontend
npm install
npm start
```

기본 포트: **3000**

API URL은 `frontend/src/config.js`에서 관리합니다:

```js
development: {
  apiUrl: 'http://localhost:8000',
}
```

---

### 4. 데이터베이스

```bash
# Docker로 MySQL + Redis 실행 (개발용)
docker-compose up -d

# 또는 로컬 MySQL에 DB 생성
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS test_management CHARACTER SET utf8mb4;"
```

---

## 환경변수

`server/.env` 기준입니다. `server/.env.example`을 복사해서 사용하세요.

### 필수

| 변수 | 설명 | 예시 |
|------|------|------|
| `DATABASE_URL` | MySQL 연결 URL | `mysql://user:pass@localhost:3306/test_management` |
| `JWT_SECRET_KEY` | JWT 서명 키 (32자 이상) | 임의의 긴 문자열 |
| `REDIS_URL` | Redis 연결 URL | `redis://localhost:6379` |

> **비밀번호 특수문자 주의**: URL에서 `#` → `%23`, `$` → `%24` 로 인코딩 필요

### 서버

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `NODE_ENV` | `development` | 실행 환경 |
| `PORT` | `8000` | 서버 포트 |
| `ALLOWED_ORIGINS` | — | CORS 허용 출처 (쉼표 구분) |
| `JWT_ACCESS_EXPIRES_IN` | `24h` | Access 토큰 만료 |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh 토큰 만료 |

> `NODE_ENV=development`이면 모든 `localhost` 포트를 자동 허용합니다.

### AI (QA 자동화 파이프라인)

| 변수 | 설명 |
|------|------|
| `ANTHROPIC_API_KEY` | Claude API 키 (`sk-ant-...`) |

### Jira 연동

| 변수 | 설명 |
|------|------|
| `JIRA_SERVER_URL` | Jira 인스턴스 URL (`https://xxx.atlassian.net`) |
| `JIRA_USERNAME` | Jira 계정 이메일 |
| `JIRA_API_TOKEN` | Jira API 토큰 |
| `JIRA_PROJECT_KEY` | 기본 프로젝트 키 |
| `JIRA_WATCHED_PROJECTS` | 웹훅 이슈 생성 시 처리할 프로젝트 키 목록 (쉼표 구분) |
| `JIRA_WEBHOOK_SECRET` | Jira 웹훅 검증용 시크릿 |
| `JIRA_CRON_ENABLED` | 크론 폴러 활성화 (`true` / `false`) |
| `JIRA_CRON_JQL` | 크론 폴러 JQL (기본: `labels = "qa-requested" OR status = "Ready for QA"`) |

### Slack 연동

| 변수 | 설명 |
|------|------|
| `SLACK_BOT_TOKEN` | Slack Bot Token (`xoxb-...`) |
| `SLACK_CHANNEL_ID` | 알림 수신 채널 ID |
| `SLACK_WEBHOOK_URL` | Incoming Webhook URL (선택) |

---

## 프로젝트 구조

```
TMS/
├── server/                        # TypeScript 백엔드
│   ├── src/
│   │   ├── index.ts               # 서버 진입점
│   │   ├── app.ts                 # Hono 앱 설정
│   │   ├── env.ts                 # 환경변수 파싱 (Zod)
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT 인증 미들웨어
│   │   │   └── cors.ts            # CORS 설정
│   │   ├── routes/                # API 라우터
│   │   │   ├── index.ts           # 라우터 등록
│   │   │   ├── auth.ts
│   │   │   ├── testcases.ts
│   │   │   ├── testcasesExtended.ts  # 다운로드, 임포트, 상태 등
│   │   │   ├── folders.ts
│   │   │   ├── pipeline.ts        # QA 파이프라인
│   │   │   ├── jira.ts            # Jira 웹훅 & 연동
│   │   │   └── slack.ts           # Slack 인터랙션
│   │   └── lib/
│   │       ├── db.ts              # Prisma 클라이언트
│   │       ├── jiraPipeline.ts    # BullMQ 파이프라인 워커
│   │       ├── jiraCollectorService.ts
│   │       ├── jiraCronPoller.ts  # 30분 주기 Jira 폴러
│   │       ├── ticketNormalizer.ts # isQATarget 판단 로직
│   │       ├── slackNotifier.ts   # Slack 메시지 발송
│   │       ├── qaPlanGenerator.ts # Claude 기반 QA Plan 생성
│   │       └── logger.ts          # Pino 로거
│   ├── prisma/
│   │   └── schema.prisma          # DB 스키마
│   ├── .env.example
│   └── package.json
├── frontend/                      # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── testcases/         # TC 관리
│   │   │   ├── pipeline/          # QA 파이프라인 UI
│   │   │   ├── jira/              # Jira 연동 UI
│   │   │   ├── settings/          # 프로젝트/폴더 관리
│   │   │   ├── automation/        # Playwright 테스트
│   │   │   ├── performance/       # K6 성능 테스트
│   │   │   └── dashboard/         # 대시보드
│   │   ├── hooks/
│   │   │   └── usePipeline.js     # 파이프라인 훅
│   │   └── config.js              # API URL 설정
│   └── package.json
├── test-scripts/
│   ├── playwright/                # Playwright 자동화 스크립트
│   └── k6/                        # K6 성능 스크립트
├── docker-compose.yml             # 개발용 (MySQL + Redis)
├── docker-compose.ubuntu.yml      # 운영용 (Ubuntu + MySQL)
├── run.sh                         # K6 실행 스크립트 (macOS/Linux)
└── run.ps1                        # K6 실행 스크립트 (Windows)
```

---

## QA 자동화 파이프라인

Jira 이슈를 감지해 TC를 자동 생성하는 파이프라인입니다.

```
Jira 이슈 생성/업데이트
    ↓ (웹훅 또는 크론 폴러)
티켓 수집 (CollectedTicket)
    ↓
Claude AI → QA Plan 생성
    ↓
Slack 승인 요청 (승인 / 반려 / 취소)
    ↓ 승인
TC 자동 생성 → 페이지 분석 → 코드 생성 → 테스트 실행 → 리포트 → 버그 등록
```

### QA 대상 판단 기준 (`isQATarget`)

다음 중 하나라도 해당하면 파이프라인 실행:
- `labels`에 `qa-requested` 포함
- `status`가 `Ready for QA`
- `issuetype`이 `Bug`
- `issuetype`이 `Task` + `summary`에 `QA` 포함

### 파이프라인 상태

`collected` → `qaplan` → `testcases` → `pageanalysis` → `codegen` → `testrun` → `report` → `bugs`

---

## 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 배포합니다.

### 인프라 구성 (AWS ap-northeast-2)

| 구성 요소 | AWS 서비스 | 세부 정보 |
|-----------|-----------|---------|
| 백엔드 | ECS Fargate | 클러스터: `ecs-tms-cluster`, 서비스: `tms-server-service` |
| 컨테이너 이미지 | ECR | 리포지토리: `tms-server` |
| 프론트엔드 | S3 + CloudFront | 정적 파일 배포 |

### CI/CD 파이프라인

#### 백엔드 자동 배포 (`.github/workflows/deploy-server.yml`)

`server/` 경로 변경 시 트리거:

```
1. Docker 이미지 빌드
2. ECR(tms-server) push
3. ECS 태스크 정의 업데이트 (환경변수 주입)
4. ECS 서비스 배포 (tms-server-service)
```

#### 프론트엔드 자동 배포 (`.github/workflows/deploy-frontend.yml`)

`frontend/` 경로 변경 시 트리거:

```
1. npm run build (REACT_APP_API_URL 환경변수 주입)
2. S3 버킷 sync
3. CloudFront 캐시 무효화
```

### GitHub Secrets 설정

| Secret | 설명 |
|--------|------|
| `AWS_ACCESS_KEY_ID` | AWS IAM 액세스 키 |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM 시크릿 키 |
| `REACT_APP_API_URL` | 프론트엔드 API URL (CloudFront/ECS 엔드포인트) |
| `REACT_APP_UPLOAD_URL` | 파일 업로드 URL |
| `S3_BUCKET` | 프론트엔드 정적 파일 S3 버킷명 |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront 배포 ID |
| `JIRA_SERVER_URL` | Jira 인스턴스 URL |
| `JIRA_USERNAME` | Jira 계정 이메일 |
| `JIRA_API_TOKEN` | Jira API 토큰 |
| `SLACK_BOT_TOKEN` | Slack Bot Token |
| `SLACK_CHANNEL_ID` | Slack 알림 채널 ID |
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `DATABASE_URL` | RDS MySQL 연결 URL |
| `REDIS_URL` | ElastiCache Redis 연결 URL |
| `JWT_SECRET_KEY` | JWT 서명 키 |

---

## API 주요 엔드포인트

서버 기본 URL: `http://localhost:8000`
모든 경로는 `/api/` prefix도 동시 지원합니다 (예: `/api/testcases`).

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/auth/login` | 로그인 |
| POST | `/auth/register` | 회원가입 |
| GET | `/testcases` | TC 목록 (필터/페이지네이션) |
| POST | `/testcases` | TC 생성 |
| GET | `/testcases/download` | TC CSV 다운로드 (필터/선택 ids 지원) |
| GET | `/folders/tree` | 폴더 트리 조회 |
| GET | `/pipeline` | QA 파이프라인 목록 |
| GET | `/pipeline/:id` | 파이프라인 상세 |
| POST | `/pipeline/:id/approve` | QA Plan 승인/반려/취소 |
| POST | `/jira/webhook` | Jira 웹훅 수신 |
| POST | `/slack/interaction` | Slack 버튼 인터랙션 수신 |
| GET | `/dashboard` | 대시보드 통계 |

---

## 개발 스크립트

### server/

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (파일 감시, 자동 재시작) |
| `npm run build` | TypeScript 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run test` | 단위 테스트 (Vitest) |
| `npm run test:coverage` | 커버리지 리포트 |
| `npm run db:generate` | Prisma 클라이언트 생성 |
| `npm run db:migrate` | DB 마이그레이션 (개발) |
| `npm run db:migrate:deploy` | DB 마이그레이션 (운영) |
| `npm run db:studio` | Prisma Studio (DB GUI) |

---

## 권한 시스템

| 역할 | 권한 |
|------|------|
| `admin` | 전체 기능 + 사용자/프로젝트 관리 |
| `user` | TC 생성/수정/삭제/실행, 폴더 관리 |
| `viewer` | 읽기 전용 |
| `guest` | 비로그인 제한적 접근 |

---

## 트러블슈팅

### DB 연결 오류 (P1012 / P1013)
- `DATABASE_URL`이 `mysql://`로 시작하는지 확인
- 비밀번호 특수문자 URL 인코딩 확인 (`#` → `%23`, `$` → `%24`)

### Prisma 클라이언트 오류
```bash
cd server && npm run db:generate
```

### CORS 오류
- `server/.env`의 `ALLOWED_ORIGINS`에 프론트엔드 출처 추가
- 개발 환경(`NODE_ENV=development`)에서는 `localhost` 전체 자동 허용

### 포트 충돌
- `.env`의 `PORT` 변경 후 `frontend/src/config.js`의 `apiUrl`도 맞춰 수정

### BullMQ / Redis 연결 오류
- `REDIS_URL` 환경변수 확인
- Redis 서버 실행 여부 확인: `redis-cli ping`

### Slack 웹훅 미수신
- Slack App 설정 > Interactivity & Shortcuts > Request URL에 `/slack/interaction` 등록 필요
- `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID` 설정 확인

---

**버전**: 3.0.0
**마지막 업데이트**: 2026년 9월
