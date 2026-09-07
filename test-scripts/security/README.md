# 프라이빗 SaaS 보안 테스트 스위트

모의해킹 절차 중 자동화 가능한 항목(인가/IDOR/테넌트 격리, Brute Force/Rate Limit, JWT 조작)을
Playwright(JS) + K6(JS)로 구현.

## 사전 준비

```bash
npm install --save-dev @playwright/test jsonwebtoken
npx playwright install
```

**필수 원칙**
- 반드시 스테이징/QA 전용 환경에서만 실행 (운영 환경 대상 절대 금지)
- 테스트 계정은 실제 고객 데이터와 완전히 분리된 시딩 데이터로 구성
- 실행 전 관련 팀(인프라/보안)에 공지 및 승인 확보
- Brute Force 테스트로 계정이 잠길 수 있으므로 테스트 후 초기화 절차 준비

## 환경변수

| 변수 | 설명 |
|---|---|
| `TARGET_BASE_URL` | 테스트 대상 API base URL |
| `TENANT_A_USER_EMAIL` / `TENANT_A_USER_PASSWORD` | 테넌트A 일반 사용자 |
| `TENANT_B_USER_EMAIL` / `TENANT_B_USER_PASSWORD` | 테넌트B 일반 사용자 |
| `TENANT_A_ADMIN_EMAIL` / `TENANT_A_ADMIN_PASSWORD` | 테넌트A 관리자 |
| `TARGET_ACCOUNT_EMAIL` | K6 brute force 테스트 대상 계정 |

`.env` 파일 또는 CI Secret으로 관리하고, 절대 코드에 하드코딩하지 않음.

## 실행

```bash
# Playwright - IDOR / 테넌트 격리 / 인가
npx playwright test tests/security/idor-tenant-isolation.spec.js

# Playwright - JWT 조작
npx playwright test tests/security/jwt-tampering.spec.js

# K6 - Rate Limit / Brute Force
k6 run k6/rate-limit-brute-force.js
```

## 각 API 스펙에 맞게 수정 필요한 부분

1. `/api/auth/login` 요청/응답 필드명 (accessToken vs token 등)
2. `/api/orders` → 실제 보호된 리소스 엔드포인트로 교체
3. JWT payload의 `role`, `tenantId` 클레임명을 실제 스펙에 맞게 조정
4. Mass Assignment 테스트의 `/api/users/me` PATCH body 필드

## 다음 단계 (수동 검증 필요 - 자동화 한계 영역)

- 비즈니스 로직 결함 (가격 조작, 워크플로우 우회 등)
- SSRF (webhook/이미지 URL 필드가 있는 경우, 별도 시나리오 설계 필요)
- 클라우드 인프라 설정 (S3 버킷 공개, IAM 과다 권한) - IaC 스캔 도구(Checkov 등) 별도 사용 권장
- Nuclei/ZAP 등 자동 스캐너 결과와 본 스위트를 상호 보완적으로 사용