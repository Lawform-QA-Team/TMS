# 프로젝트 구조 상세 가이드

## 📁 전체 프로젝트 구조

```
integrated-test-platform/
├── 📁 backend/                    # Flask 백엔드 API 서버
│   ├── 📄 app.py                  # 메인 Flask 애플리케이션
│   ├── 📄 celery_app.py          # Celery 비동기 작업 설정
│   ├── 📄 tasks.py               # Celery 태스크 정의
│   ├── 📄 socketio_handlers.py  # WebSocket 이벤트 핸들러
│   ├── 📄 vercel.json            # Vercel 배포 설정
│   ├── 📄 requirements.txt       # Python 의존성
│   ├── 📄 Dockerfile             # Docker 컨테이너 설정
│   ├── 📁 engines/               # 테스트 엔진 모듈
│   │   ├── 📄 __init__.py
│   │   └── 📄 k6_engine.py      # K6 성능 테스트 엔진
│   ├── 📁 routes/                # API 라우트 모듈
│   │   ├── 📄 __init__.py
│   │   ├── 📄 analytics.py       # 분석 및 트렌드 API
│   │   ├── 📄 auth.py            # 인증 API
│   │   ├── 📄 automation.py      # 자동화 테스트 API
│   │   ├── 📄 cicd.py            # CI/CD 통합 API
│   │   ├── 📄 collaboration.py   # 협업 및 워크플로우 API
│   │   ├── 📄 dashboard_extended.py # 확장 대시보드 API
│   │   ├── 📄 dependencies.py    # 테스트 의존성 관리 API
│   │   ├── 📄 folders.py         # 폴더 관리 API
│   │   ├── 📄 jira_integration.py # JIRA 연동 API
│   │   ├── 📄 jira_issues.py     # JIRA 이슈 관리 API (DB 기반)
│   │   ├── 📄 notifications.py   # 알림 관리 API
│   │   ├── 📄 performance.py    # 성능 테스트 API
│   │   ├── 📄 queue.py           # 큐 관리 API
│   │   ├── 📄 reports.py         # 커스텀 리포트 API
│   │   ├── 📄 schedules.py       # 테스트 스케줄 관리 API
│   │   ├── 📄 settings.py        # 시스템 설정 API
│   │   ├── 📄 test_data.py       # 테스트 데이터 관리 API
│   │   ├── 📄 test_scripts.py    # 테스트 스크립트 관리 API
│   │   ├── 📄 testcases.py       # 테스트 케이스 API
│   │   ├── 📄 testcases_extended.py # 확장 테스트 케이스 API
│   │   └── 📄 users.py           # 사용자 관리 API
│   ├── 📁 services/              # 비즈니스 로직 서비스
│   │   ├── 📄 cache_service.py         # 캐싱 서비스
│   │   ├── 📄 cicd_service.py         # CI/CD 서비스
│   │   ├── 📄 collaboration_service.py # 협업 서비스
│   │   ├── 📄 dependency_service.py    # 의존성 서비스
│   │   ├── 📄 notification_service.py # 알림 서비스
│   │   ├── 📄 report_service.py        # 리포트 서비스
│   │   ├── 📄 scheduler_service.py    # 스케줄러 서비스
│   │   ├── 📄 slack_webhook_form.py   # Slack 웹훅 서비스
│   │   ├── 📄 test_data_service.py    # 테스트 데이터 서비스
│   │   └── 📄 testcase_service.py     # 테스트 케이스 서비스
│   ├── 📁 utils/                 # 유틸리티 모듈
│   │   ├── 📄 auth_constants.py  # 인증 상수
│   │   ├── 📄 auth_decorators.py # 인증 데코레이터
│   │   ├── 📄 auth_helpers.py    # 인증 헬퍼 함수
│   │   ├── 📄 common_helpers.py  # 공통 헬퍼 함수
│   │   ├── 📄 compression.py     # 응답 압축 유틸리티
│   │   ├── 📄 cors.py            # CORS 설정
│   │   ├── 📄 db_helper.py       # DB 헬퍼 함수
│   │   ├── 📄 db_init.py         # DB 초기화 유틸리티
│   │   ├── 📄 history_tracker.py # 변경 이력 추적
│   │   ├── 📄 jira_client.py     # JIRA 클라이언트
│   │   ├── 📄 jwt_callbacks.py   # JWT 콜백 핸들러
│   │   ├── 📄 logger.py          # 로깅 유틸리티
│   │   ├── 📄 playwright_steps_runner.py # Playwright 단계 실행기
│   │   ├── 📄 response_utils.py  # API 응답 유틸리티
│   │   ├── 📄 serializers.py     # 데이터 직렬화
│   │   └── 📄 timezone_utils.py  # KST 시간대 처리 유틸리티
│   ├── 📁 migrations/            # 데이터베이스 마이그레이션
│   ├── 📁 config/                # 설정 파일들
│   └── 📁 tests/                 # 백엔드 테스트
├── 📁 frontend/                  # React 프론트엔드 애플리케이션
│   ├── 📄 package.json           # Node.js 의존성
│   ├── 📄 craco.config.js        # Craco 설정
│   ├── 📁 src/                   # 소스 코드
│   │   ├── 📁 components/        # React 컴포넌트들
│   │   ├── 📁 contexts/         # React Context
│   │   ├── 📁 hooks/             # 커스텀 훅
│   │   ├── 📁 pages/             # 페이지 컴포넌트
│   │   └── 📁 services/          # API 서비스
│   └── 📁 public/                # 정적 자산
├── 📁 test-scripts/              # 테스트 스크립트 모음
│   ├── 📁 common/                # 공통 유틸리티 스크립트
│   ├── 📁 performance/           # 성능 테스트 스크립트 (K6)
│   │   ├── 📁 lawform/           # 법률 서식 관련 테스트
│   │   ├── 📁 samsung/           # 삼성 관련 테스트
│   │   └── 📁 HSAD/              # HSAD 관련 테스트
│   └── 📁 playwright/            # 자동화 테스트 스크립트 (Playwright)
│       ├── 📁 lawform/
│       ├── 📁 samsung/
│       └── 📁 HSAD/
├── 📁 docs/                      # 프로젝트 문서
│   ├── 📁 database/              # 데이터베이스 설정 가이드
│   ├── 📁 deployment/            # 배포 가이드
│   ├── 📁 reports/               # 분석 리포트
│   ├── 📄 API_TESTING_GUIDE.md   # API 테스트 가이드
│   ├── 📄 PROJECT_STRUCTURE.md   # 프로젝트 구조 (이 파일)
│   ├── 📄 TESTING_GUIDE.md      # 테스트 가이드
│   └── 📄 PERMISSION_GUIDE.md    # 권한별 기능 가이드
├── 📁 scripts/                   # 관리 및 유틸리티 스크립트
├── 📄 docker-compose.yml        # Docker Compose 설정
└── 📄 README.md                 # 프로젝트 메인 README
```

## 🔧 주요 변경사항 (2026년 5월 11일)

### ✅ 문서 및 구조 최신화 (v2.7.0)
- **전체 문서 최신화**: 모든 가이드 문서의 버전 및 날짜를 2026년 5월 기준으로 업데이트
- **경로 동기화**: 실제 디렉토리 구조와 문서 내 경로를 일치시킴
- **누락된 모듈 추가**: `settings.py`, `test_scripts.py`, `slack_webhook_form.py` 등 최근 추가된 파일들 반영
- **유틸리티 세분화**: `utils/` 하위의 다양한 헬퍼 및 유틸리티 파일들 상세 기술

### ✅ 고급 기능 안정화 (v2.6.0)
- **Slack 리포트 통합**: Playwright 테스트 결과를 Slack으로 자동 전송하는 기능 추가
- **JIRA 통계 강화**: 환경별(dev, staging, prod) JIRA 이슈 통계 API 추가
- **데이터베이스 스키마 개선**: `assignee_id` 등 협업에 필요한 컬럼 추가 및 마이그레이션

## 📊 현재 상태

- **백엔드**: v2.7.0 (KST 시간대 처리, 고급 기능 구현, Slack 연동 완료)
- **프론트엔드**: React 18+ 기반, Monaco Editor 통합, 실시간 알림 지원
- **데이터베이스**: MySQL 8.0, PostgreSQL 지원 (psycopg2)
- **문서**: v2.7.0 기준으로 전면 최신화 완료

---

**마지막 업데이트**: 2026년 5월 11일  
**버전**: 2.7.0  
**상태**: 프로덕션 배포 완료 ✅
