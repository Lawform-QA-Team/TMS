# 코드 레벨 테스트 + GitHub Actions CI/CD 확장 계획서

> FE/BE 모두 JS/TS 기반 프로젝트를 대상으로,
> 코드 레벨 단위/통합 테스트를 추가하고 GitHub Actions로 PR merge 게이트를 구성하는 계획.

---

## 1. 전제 조건 (대상 프로젝트 스택)

| 영역 | 스택 |
|---|---|
| Backend | Node.js + Express / Fastify / NestJS (TypeScript 권장) |
| Frontend | React / Next.js (JavaScript 또는 TypeScript) |
| 테스트 프레임워크 | Jest 또는 Vitest (둘 다 동일 패턴, 선택 기준은 아래 참고) |
| CI | GitHub Actions |

> **Jest vs Vitest 선택 기준**
> - Vite 기반 프로젝트(Vite, Next.js 13+) → **Vitest** (설정 간단, 속도 빠름)
> - Create React App, NestJS, Express 등 → **Jest** (생태계 안정적)
> - 둘 다 API가 거의 동일하므로 이 문서의 코드는 양쪽 모두 적용 가능

---

## 2. 디렉토리 구조 설계

```
project-root/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── tests/
│   │   ├── setup.ts              # 공통 테스트 설정 (DB 연결 등)
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.test.ts
│   │   │   │   └── user.service.test.ts
│   │   │   └── utils/
│   │   │       └── validators.test.ts
│   │   └── integration/
│   │       ├── auth.test.ts      # POST /auth/login 등
│   │       ├── users.test.ts     # 사용자 CRUD API
│   │       └── testcases.test.ts
│   ├── jest.config.ts            # 또는 vitest.config.ts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   └── components/
│   │       ├── auth/
│   │       │   ├── Login.tsx
│   │       │   └── Login.test.tsx
│   │       └── dashboard/
│   │           ├── Dashboard.tsx
│   │           └── Dashboard.test.tsx
│   ├── jest.config.ts            # 또는 vitest.config.ts
│   └── package.json
│
└── .github/
    └── workflows/
        ├── ci.yml      # push/PR 시 자동 실행
        └── e2e.yml     # 배포 완료 후 실행 (Playwright)
```

---

## 3. 백엔드 테스트 — Node.js (Jest / Vitest)

### 3-1. 설치

```bash
cd backend

# Jest + TypeScript
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest

# 또는 Vitest
npm install --save-dev vitest supertest @types/supertest
```

### 3-2. jest.config.ts

```ts
// backend/jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterFramework: ['./tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};

export default config;
```

### 3-3. 공통 테스트 설정 (setup.ts)

```ts
// backend/tests/setup.ts
import { app } from '../src/app';
import { db } from '../src/db';   // DB 연결 인스턴스 (Prisma, TypeORM 등)

// 테스트 전 DB 초기화
beforeAll(async () => {
  await db.connect({ database: 'test_db' });
});

// 각 테스트 후 데이터 정리
afterEach(async () => {
  await db.clearAll();  // 또는 트랜잭션 롤백
});

// 전체 종료 후 DB 연결 해제
afterAll(async () => {
  await db.disconnect();
});

export { app };
```

### 3-4. 단위 테스트 예시

```ts
// backend/tests/unit/services/auth.service.test.ts
import { AuthService } from '../../../src/services/auth.service';
import { hashPassword, comparePassword } from '../../../src/utils/crypto';

jest.mock('../../../src/utils/crypto');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  test('비밀번호 해싱 후 검증 성공', async () => {
    (hashPassword as jest.Mock).mockResolvedValue('hashed');
    (comparePassword as jest.Mock).mockResolvedValue(true);

    const result = await authService.validatePassword('plain', 'hashed');
    expect(result).toBe(true);
  });

  test('토큰 생성 시 userId 포함', () => {
    const token = authService.generateToken({ userId: '123', role: 'admin' });
    const decoded = authService.verifyToken(token);
    expect(decoded.userId).toBe('123');
  });
});
```

### 3-5. 통합 테스트 예시 (supertest)

```ts
// backend/tests/integration/auth.test.ts
import request from 'supertest';
import { app } from '../setup';

describe('POST /api/auth/login', () => {
  test('올바른 자격증명 → 200 + token 반환', async () => {
    await createTestUser({ email: 'test@test.com', password: 'pass1234' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'pass1234' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('잘못된 비밀번호 → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  test('인증 없이 보호된 라우트 접근 → 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

// backend/tests/integration/testcases.test.ts
describe('TestCases API', () => {
  let token: string;

  beforeEach(async () => {
    token = await getTestToken();  // helper: 로그인 후 token 반환
  });

  test('테스트케이스 생성 → 201', async () => {
    const res = await request(app)
      .post('/api/testcases')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '로그인 테스트', description: '설명' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('로그인 테스트');
  });

  test('목록 조회 → 200 + 배열 반환', async () => {
    const res = await request(app)
      .get('/api/testcases')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

### 3-6. NestJS 사용 시 추가 고려

```ts
// NestJS는 자체 테스트 모듈 제공 (supertest 대신 사용 가능)
import { Test } from '@nestjs/testing';
import { AuthModule } from '../src/auth/auth.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // 이하 supertest 패턴 동일
});
```

### 3-7. 실행 명령

```bash
# 전체 실행
npm test

# 커버리지 포함
npm test -- --coverage

# watch 모드 (개발 중)
npm test -- --watch

# 특정 파일만
npm test -- auth.test.ts
```

---

## 4. 프론트엔드 테스트 — React (Jest / Vitest + RTL)

### 4-1. 설치

```bash
cd frontend

# Jest 기반
npm install --save-dev \
  jest jest-environment-jsdom ts-jest \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event

# 또는 Vitest 기반
npm install --save-dev \
  vitest jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event
```

### 4-2. 설정

```ts
// frontend/jest.config.ts (Jest)
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',  // path alias
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
};

export default config;
```

```ts
// frontend/vite.config.ts (Vitest 사용 시 추가)
import { defineConfig } from 'vite';
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom'],
  },
});
```

### 4-3. 컴포넌트 테스트 예시

```tsx
// frontend/src/components/auth/Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';

// API 모킹
jest.mock('@/api/auth', () => ({
  login: jest.fn(),
}));
import { login } from '@/api/auth';

describe('Login 컴포넌트', () => {
  test('초기 렌더링 — 로그인 버튼 비활성화', () => {
    render(<Login />);
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();
  });

  test('이메일/비밀번호 입력 후 버튼 활성화', async () => {
    render(<Login />);
    await userEvent.type(screen.getByPlaceholderText('이메일'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('비밀번호'), 'pass1234');
    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled();
  });

  test('로그인 성공 → onSuccess 콜백 호출', async () => {
    (login as jest.Mock).mockResolvedValue({ token: 'abc' });
    const onSuccess = jest.fn();

    render(<Login onSuccess={onSuccess} />);
    await userEvent.type(screen.getByPlaceholderText('이메일'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('비밀번호'), 'pass1234');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  test('로그인 실패 → 에러 메시지 표시', async () => {
    (login as jest.Mock).mockRejectedValue(new Error('인증 실패'));

    render(<Login />);
    await userEvent.type(screen.getByPlaceholderText('이메일'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('비밀번호'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByText(/인증 실패/i)).toBeInTheDocument();
    });
  });
});
```

```tsx
// frontend/src/components/dashboard/Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

const mockData = {
  totalTests: 150,
  passRate: 94.5,
  recentRuns: [
    { id: 1, name: '로그인 테스트', status: 'pass' },
    { id: 2, name: '검색 테스트', status: 'fail' },
  ],
};

test('통계 수치 렌더링', () => {
  render(<Dashboard data={mockData} />);
  expect(screen.getByText('150')).toBeInTheDocument();
  expect(screen.getByText('94.5%')).toBeInTheDocument();
});

test('실패 항목에 fail 배지 표시', () => {
  render(<Dashboard data={mockData} />);
  const failBadges = screen.getAllByText('fail');
  expect(failBadges).toHaveLength(1);
});
```

### 4-4. 커스텀 훅 테스트 예시

```tsx
// frontend/src/hooks/useTestCases.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTestCases } from './useTestCases';

jest.mock('@/api/testcases');
import { fetchTestCases } from '@/api/testcases';

test('테스트케이스 목록 로딩', async () => {
  (fetchTestCases as jest.Mock).mockResolvedValue([
    { id: 1, title: '테스트 1' },
  ]);

  const { result } = renderHook(() => useTestCases());

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toHaveLength(1);
});
```

---

## 5. GitHub Actions 워크플로우

### 5-1. ci.yml — PR/push 시 자동 실행

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      # 통합 테스트용 DB (프로젝트에 맞게 변경)
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: --health-cmd="pg_isready" --health-interval=10s

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Type check
        run: cd backend && npx tsc --noEmit

      - name: Run tests
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          JWT_SECRET: test-secret
        run: cd backend && npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: backend/coverage/lcov.info
          flags: backend

  frontend-test:
    name: Frontend Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Type check
        run: cd frontend && npx tsc --noEmit

      - name: Run tests
        run: cd frontend && npm test -- --coverage --watchAll=false --passWithNoTests

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: frontend/coverage/lcov.info
          flags: frontend

  # Branch Protection에서 이 job을 필수 status check로 등록
  ci-success:
    name: CI Passed
    needs: [backend-test, frontend-test]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All CI checks passed ✅"
```

### 5-2. e2e.yml — 배포 완료 후 Playwright E2E 실행

```yaml
# .github/workflows/e2e.yml
name: E2E Tests (Post-Deploy)

on:
  workflow_dispatch:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]

jobs:
  playwright:
    name: Playwright E2E
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          LOGIN_EMAIL: ${{ secrets.TEST_LOGIN_EMAIL }}
          LOGIN_PASSWORD: ${{ secrets.TEST_LOGIN_PASSWORD }}
        run: npx playwright test

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 6. GitHub Branch Protection 설정

**Settings → Branches → Add rule** (`main` 대상):

```
✅ Require a pull request before merging
    ✅ Require approvals: 1

✅ Require status checks to pass before merging
    ✅ Require branches to be up to date before merging

    필수 status checks:
    ✅ CI Passed        ← ci.yml의 ci-success job

✅ Do not allow bypassing the above settings
```

---

## 7. 전체 흐름

```
feature 브랜치 작업
    ↓
PR 생성 (→ main 또는 develop)
    ↓
ci.yml 자동 트리거
    ├── tsc --noEmit (타입 체크)
    ├── Jest/Vitest — backend 단위 + 통합 테스트
    └── Jest/Vitest — frontend 컴포넌트 + 훅 테스트
    ↓
❌ 실패 → merge 차단, PR에 실패 상세 표시
✅ 통과 → merge 가능 (리뷰 승인 후)
    ↓
main merge → 배포
    ↓
배포 완료 → e2e.yml 트리거
    └── Playwright E2E (실제 환경 검증)
```

---

## 8. 도입 우선순위

| 단계 | 작업 | 비고 |
|---|---|---|
| **1** | backend `setup.ts` + 핵심 API 통합 테스트 5~10개 | supertest로 빠르게 시작 |
| **2** | `ci.yml` 구성 (backend 테스트만) | merge 게이트 즉시 활성화 가능 |
| **3** | Branch Protection 설정 | main 직접 push 방지 |
| **4** | frontend 컴포넌트 테스트 추가 | 핵심 컴포넌트 우선 |
| **5** | Playwright E2E → `e2e.yml` 연결 | 배포 후 자동 검증 완성 |

---

## 9. 필요한 패키지 정리

### Backend (Node.js + TypeScript)

```bash
npm install --save-dev \
  jest ts-jest @types/jest \
  supertest @types/supertest

# 또는 Vitest
npm install --save-dev vitest supertest @types/supertest
```

### Frontend (React + TypeScript)

```bash
npm install --save-dev \
  jest jest-environment-jsdom ts-jest \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event \
  identity-obj-proxy

# 또는 Vitest
npm install --save-dev \
  vitest jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event
```
