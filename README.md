# Integrated Test Platform

## 프로젝트 개요

통합 테스트 플랫폼은 다양한 테스트 유형(API, 성능, 자동화)을 통합 관리할 수 있는 웹 기반 플랫폼입니다.

## 주요 기능

- **Test Cases**: 테스트 케이스 관리 및 실행
- **Performance Tests**: K6 기반 성능 테스트
- **Automation Tests**: Playwright 기반 자동화 테스트
- **Folder Management**: 계층적 폴더 구조 관리
- **Dashboard**: 테스트 결과 통계 및 분석
- **User Management**: 사용자 및 프로젝트 관리
- **Jira 연동**: Jira 이슈 자동 TC 생성 파이프라인

---

## 기술 스택

### Backend (TypeScript)
- **Node.js 20+**
- **TypeScript**
- **Hono** — 경량 웹 프레임워크
- **Prisma** — ORM
- **MySQL 8.0+**
- **bcryptjs** — 비밀번호 해싱
- **Jose** — JWT 인증

### Backend (Python — Legacy)
- **Python 3.13+** / **Flask 3.1+** / **SQLAlchemy 2.0+**
- 일부 레거시 기능은 `backend/` 디렉토리에서 관리

### Frontend
- **React 18+**
- **Axios**
- **Chart.js**
- **Monaco Editor**

### Testing Tools
- **K6** (성능 테스트)
- **Playwright** (자동화 테스트)

---

## 빠른 시작

### 사전 요구사항

- Node.js 20.12+
- MySQL 8.0+
- Python 3.13+ (레거시 백엔드 실행 시)

---

### 1. 저장소 클론

```bash
git clone <repository-url>
cd TMS
```

---

### 2. TypeScript 백엔드 설치 및 실행

```bash
cd server
npm install
```

**환경 변수 설정**

```bash
cp .env.example .env
```

`.env` 파일에서 아래 항목을 실제 값으로 수정합니다:

```env
NODE_ENV=development
PORT=8080

# MySQL 연결 (URL 인코딩 필요: # → %23, $ → %24)
DATABASE_URL=mysql://root:1q2w%23E%24R@127.0.0.1:3306/test_management

# JWT
JWT_SECRET_KEY=your-secret-key

# CORS (프론트엔드 출처)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3010
```

> **비밀번호 특수문자 주의**: URL에서 `#` → `%23`, `$` → `%24` 로 인코딩 필요

**Prisma 클라이언트 생성**

```bash
npm run db:generate
```

> 기존 DB를 사용하는 경우 `db:migrate`는 불필요합니다. 새 DB라면 아래 실행:
> ```bash
> npm run db:migrate
> ```

**서버 실행**

```bash
# 개발 모드 (파일 변경 감지 자동 재시작)
npm run dev

# 프로덕션 빌드 후 실행
npm run build
npm run start
```

서버가 정상 실행되면 `http://localhost:8080/health` 에서 상태를 확인할 수 있습니다.

```json
{"status":"healthy","message":"TMS Server is running","version":"3.0.0","database":{"status":"connected"}}
```

---

### 3. Python 레거시 백엔드 실행 (선택)

일부 기능(Slack 알림, 화이트박스 테스트 등)은 아직 Python 백엔드에서 처리됩니다.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

기본 포트: **8000**

---

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

기본 포트: **3000** (또는 3010 등 다음 빈 포트)

프론트엔드 API 요청 대상은 `frontend/src/config.js` 에서 관리합니다:

```js
development: {
  apiUrl: 'http://localhost:8080',  // TS 백엔드
}
```

---

### 5. 데이터베이스 설정

로컬 MySQL을 직접 사용하거나 Docker를 사용할 수 있습니다.

```bash
# Docker로 MySQL 실행
docker-compose up -d mysql

# 또는 로컬 MySQL에 DB 생성
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS test_management CHARACTER SET utf8mb4;"
```

---

## 프로젝트 구조

```
TMS/
├── server/                  # TypeScript 백엔드 (메인)
│   ├── src/
│   │   ├── app.ts           # Hono 앱 설정
│   │   ├── index.ts         # 서버 진입점
│   │   ├── env.ts           # 환경 변수 파싱
│   │   ├── lib/
│   │   │   ├── db.ts        # Prisma 클라이언트
│   │   │   ├── logger.ts    # 로거
│   │   │   └── password.ts  # bcrypt + werkzeug 호환 해싱
│   │   ├── middleware/
│   │   │   ├── auth.ts      # JWT 인증 미들웨어
│   │   │   └── cors.ts      # CORS 설정
│   │   └── routes/          # API 라우트
│   ├── prisma/
│   │   └── schema.prisma    # DB 스키마 정의
│   ├── .env.example         # 환경 변수 예시
│   └── package.json
├── backend/                 # Python 레거시 백엔드
│   ├── app.py
│   ├── models.py
│   ├── routes/
│   └── utils/
├── frontend/                # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── config.js        # API URL 설정
│   └── package.json
├── docs/                    # 문서
├── scripts/                 # 유틸리티 스크립트
└── README.md
```

---

## 환경 변수 상세

### server/.env

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `NODE_ENV` | 선택 | 실행 환경 | `development` |
| `PORT` | 선택 | 서버 포트 (기본 8000) | `8080` |
| `DATABASE_URL` | **필수** | MySQL 연결 URL | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET_KEY` | **필수** | JWT 서명 키 | 임의의 긴 문자열 |
| `JWT_ACCESS_EXPIRES_IN` | 선택 | Access 토큰 만료 | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | 선택 | Refresh 토큰 만료 | `30d` |
| `ALLOWED_ORIGINS` | 선택 | CORS 허용 출처 | `http://localhost:3000` |
| `ANTHROPIC_API_KEY` | 선택 | AI 기능용 Claude API 키 | `sk-ant-...` |
| `JIRA_SERVER_URL` | 선택 | Jira 서버 URL | `https://xxx.atlassian.net` |
| `JIRA_API_TOKEN` | 선택 | Jira API 토큰 | |
| `SLACK_WEBHOOK_URL` | 선택 | Slack 알림 웹훅 | |

> **개발 환경 CORS**: `NODE_ENV=development` 일 때 `localhost` 모든 포트를 자동 허용합니다.

---

## API 엔드포인트

서버 기본 URL: `http://localhost:8080`

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/auth/login` | 로그인 |
| POST | `/auth/register` | 회원가입 |
| POST | `/auth/guest` | 게스트 로그인 |
| GET | `/auth/profile` | 내 프로필 조회 |
| GET | `/testcases` | 테스트 케이스 목록 |
| POST | `/testcases` | 테스트 케이스 생성 |
| GET | `/folders` | 폴더 목록 |
| GET | `/dashboard` | 대시보드 통계 |

모든 API는 `/api/` prefix도 동시 지원합니다 (예: `/api/auth/login`).

---

## 권한 시스템

| 역할 | 설명 |
|------|------|
| `admin` | 전체 기능 접근, 사용자 관리 |
| `user` | TC 생성/수정/실행 |
| `viewer` | 읽기 전용 |
| `guest` | 비로그인 제한적 접근 |

---

## 트러블슈팅

### DB 연결 오류 (P1012 / P1013)
- `DATABASE_URL`이 `mysql://` 로 시작하는지 확인
- 비밀번호 특수문자를 URL 인코딩했는지 확인 (`#` → `%23`, `$` → `%24`)

### 로그인 CORS 오류
- `server/.env`의 `ALLOWED_ORIGINS`에 프론트엔드 출처 추가
- 개발 환경(`NODE_ENV=development`)에서는 모든 localhost 포트가 자동 허용됨

### Prisma 클라이언트 에러
```bash
cd server && npm run db:generate
```

### 포트 충돌
- 기본 포트 8080이 사용 중이면 `.env`의 `PORT`를 변경 후 `frontend/src/config.js`의 `apiUrl`도 맞춰 수정

---

## 개발 스크립트 (server/)

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 실행 (파일 감지 자동 재시작) |
| `npm run build` | TypeScript 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run db:generate` | Prisma 클라이언트 생성 |
| `npm run db:migrate` | DB 마이그레이션 실행 |
| `npm run db:studio` | Prisma Studio (DB GUI) 실행 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run test` | 테스트 실행 |

---

## 문서

- `docs/API_TESTING_GUIDE.md` — API 테스트 가이드
- `docs/PERMISSION_GUIDE.md` — 권한별 기능 가이드
- `docs/database/` — DB 설정 가이드
- `docs/deployment/` — 배포 가이드

---

**마지막 업데이트**: 2026년 8월
**버전**: 3.0.0
**주요 변경**: Python Flask → TypeScript (Hono + Prisma) 백엔드 전환
