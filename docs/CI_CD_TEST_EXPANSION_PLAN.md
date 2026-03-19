# 코드 레벨 테스트 + GitHub Actions CI/CD 확장 계획서

> 현재 UI 기반 E2E 테스트(Playwright, k6)를 유지하면서,
> 코드 레벨 단위/통합 테스트를 추가하고 GitHub Actions로 PR merge 게이트를 구성하는 계획.

---

## 1. 현재 상태 vs 목표

| 구분 | 현재 | 목표 |
|---|---|---|
| UI E2E 테스트 | Playwright (브라우저 기반) | 그대로 유지 — 배포 후 검증용 |
| 성능 테스트 | k6 Browser | 그대로 유지 — 성능 모니터링용 |
| 백엔드 단위/통합 | 없음 | pytest 추가 |
| 프론트엔드 단위 | 없음 | Jest + React Testing Library 추가 |
| CI/CD | 없음 | GitHub Actions — PR merge 게이트 |

---

## 2. 디렉토리 구조 설계

```
TMS/
├── backend/
│   └── tests/
│       ├── conftest.py              # 공통 fixtures (테스트 클라이언트, DB 등)
│       ├── unit/
│       │   ├── test_auth.py         # utils/auth.py 함수 단위 테스트
│       │   ├── test_timezone.py     # timezone_utils.py 단위 테스트
│       │   └── test_services/
│       │       ├── test_scheduler_service.py
│       │       └── test_cicd_service.py
│       └── integration/
│           ├── test_auth_routes.py       # POST /api/auth/login 등
│           ├── test_testcases_routes.py  # 테스트케이스 CRUD API
│           ├── test_performance_routes.py
│           └── test_users_routes.py
│
├── frontend/
│   └── src/
│       └── components/
│           ├── auth/
│           │   └── Login.test.js
│           ├── dashboard/
│           │   └── Dashboard.test.js
│           └── testcases/
│               └── TestCaseList.test.js
│
└── .github/
    └── workflows/
        ├── ci.yml      # push/PR 시 자동 실행 (단위 + 통합 테스트)
        └── e2e.yml     # 배포 완료 후 실행 (Playwright E2E)
```

---

## 3. 백엔드 테스트 — pytest

### 3-1. conftest.py (핵심 fixtures)

```python
# backend/tests/conftest.py
import pytest
from app import create_app

@pytest.fixture(scope='session')
def app():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test-secret',
    })
    with app.app_context():
        from models import db
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    """로그인 후 JWT 헤더 반환"""
    res = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'testpass'
    })
    token = res.get_json()['token']
    return {'Authorization': f'Bearer {token}'}
```

### 3-2. 통합 테스트 예시

```python
# backend/tests/integration/test_auth_routes.py
def test_login_success(client):
    res = client.post('/api/auth/login', json={
        'email': 'admin@test.com', 'password': 'testpass'
    })
    assert res.status_code == 200
    assert 'token' in res.get_json()

def test_login_wrong_password(client):
    res = client.post('/api/auth/login', json={
        'email': 'admin@test.com', 'password': 'wrong'
    })
    assert res.status_code == 401

def test_protected_route_without_token(client):
    res = client.get('/api/testcases')
    assert res.status_code == 401

# backend/tests/integration/test_testcases_routes.py
def test_create_testcase(client, auth_headers):
    res = client.post('/api/testcases', json={
        'title': '테스트 케이스 1',
        'description': '설명'
    }, headers=auth_headers)
    assert res.status_code == 201
    assert res.get_json()['title'] == '테스트 케이스 1'

def test_get_testcases(client, auth_headers):
    res = client.get('/api/testcases', headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)
```

### 3-3. 실행 명령

```bash
# 전체 실행
pytest backend/tests/ -v

# 커버리지 포함
pytest backend/tests/ --cov=backend --cov-report=term-missing

# 단위만 / 통합만
pytest backend/tests/unit/
pytest backend/tests/integration/
```

---

## 4. 프론트엔드 테스트 — Jest + React Testing Library

### 4-1. 설치

```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 4-2. 테스트 예시

```js
// frontend/src/components/auth/Login.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

test('이메일/비밀번호 입력 후 로그인 버튼 활성화', () => {
    render(<Login />);
    fireEvent.change(screen.getByPlaceholderText('이메일'), {
        target: { value: 'test@test.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('비밀번호'), {
        target: { value: 'password' }
    });
    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled();
});

test('잘못된 자격증명 시 에러 메시지 표시', async () => {
    // API mock
    global.fetch = jest.fn(() =>
        Promise.resolve({ ok: false, status: 401 })
    );
    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    await waitFor(() => {
        expect(screen.getByText(/인증 실패/i)).toBeInTheDocument();
    });
});
```

```js
// frontend/src/components/testcases/TestCaseList.test.js
import { render, screen } from '@testing-library/react';
import TestCaseList from './TestCaseList';

const mockTestCases = [
    { id: 1, title: '로그인 테스트', status: 'pass' },
    { id: 2, title: '검색 테스트', status: 'fail' },
];

test('테스트케이스 목록 렌더링', () => {
    render(<TestCaseList items={mockTestCases} />);
    expect(screen.getByText('로그인 테스트')).toBeInTheDocument();
    expect(screen.getByText('검색 테스트')).toBeInTheDocument();
});
```

### 4-3. 실행 명령

```bash
cd frontend

# 전체 실행 (CI 모드)
npm test -- --watchAll=false

# 커버리지 포함
npm test -- --coverage --watchAll=false
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
    name: Backend Tests (pytest)
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_DATABASE: tms_test
          MYSQL_ROOT_PASSWORD: testpass
          MYSQL_USER: tms
          MYSQL_PASSWORD: testpass
        ports: ['3306:3306']
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r backend/requirements.txt

      - name: Run tests
        env:
          FLASK_ENV: testing
          TEST_DATABASE_URL: mysql+pymysql://tms:testpass@localhost:3306/tms_test
        run: |
          cd backend
          pytest tests/ -v --cov=. --cov-report=xml --cov-report=term-missing

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: backend/coverage.xml

  frontend-test:
    name: Frontend Tests (Jest)
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

      - name: Run tests
        run: cd frontend && npm test -- --coverage --watchAll=false --passWithNoTests

  # 두 job 모두 통과해야 merge 가능 (Branch Protection에서 이 job을 필수로 지정)
  ci-success:
    name: CI Passed
    needs: [backend-test, frontend-test]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All CI checks passed ✅"
```

### 5-2. e2e.yml — 배포 후 E2E 실행 (선택)

```yaml
# .github/workflows/e2e.yml
name: E2E Tests (Post-Deploy)

on:
  # 배포 워크플로우 완료 후 트리거, 또는 수동 실행
  workflow_dispatch:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]

jobs:
  playwright-e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Playwright
        run: |
          cd test-scripts/playwright
          npm ci
          npx playwright install chromium

      - name: Run E2E tests
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          LOGIN_EMAIL: ${{ secrets.TEST_LOGIN_EMAIL }}
          LOGIN_PASSWORD: ${{ secrets.TEST_LOGIN_PASSWORD }}
        run: |
          cd test-scripts/playwright
          npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: test-scripts/playwright/playwright-report/
```

---

## 6. GitHub Branch Protection 설정

GitHub 레포 → **Settings → Branches → Add rule** (`main` 또는 `develop` 대상):

```
✅ Require a pull request before merging
    ✅ Require approvals: 1 (팀 상황에 따라 조정)

✅ Require status checks to pass before merging
    ✅ Require branches to be up to date before merging

    필수 status checks:
    ✅ CI Passed          ← ci.yml의 ci-success job
    (선택) backend-test
    (선택) frontend-test

✅ Do not allow bypassing the above settings
```

→ CI 실패 시 merge 버튼 비활성화됨.

---

## 7. 전체 흐름

```
개발자 feature 브랜치에서 작업
    ↓
PR 생성 (main 또는 develop 대상)
    ↓
GitHub Actions ci.yml 자동 트리거
    ├── [Job 1] pytest (backend 단위 + 통합)
    └── [Job 2] jest (frontend 컴포넌트)
    ↓
❌ 실패 → merge 차단, PR에 실패 표시
✅ 통과 → merge 가능 (리뷰 승인 후)
    ↓
main merge → 배포 워크플로우 실행
    ↓
배포 완료 → e2e.yml 트리거 (선택)
    └── Playwright E2E (실제 환경 검증)
```

---

## 8. 도입 우선순위

| 단계 | 작업 | 예상 효과 |
|---|---|---|
| **1** | `backend/tests/conftest.py` + 핵심 API 통합 테스트 5~10개 | 회귀 버그 조기 발견 |
| **2** | `ci.yml` 기본 구성 (pytest만) | PR merge 게이트 활성화 |
| **3** | GitHub Branch Protection 설정 | 실수로 인한 main 직접 push 방지 |
| **4** | frontend Jest 테스트 추가 | 컴포넌트 리팩토링 안전망 |
| **5** | Playwright E2E → `e2e.yml` 연결 | 배포 후 자동 검증 완성 |

---

## 9. 참고 — 필요한 패키지

### Backend

```
# backend/requirements.txt에 추가
pytest==8.x
pytest-flask==1.x
pytest-cov==5.x
pytest-mock==3.x
```

### Frontend

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom
```
