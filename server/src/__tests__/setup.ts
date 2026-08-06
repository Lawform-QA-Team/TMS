// 테스트 환경 변수 설정 (env.ts 파싱보다 먼저 실행)
process.env['NODE_ENV'] = 'test'
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test'
process.env['JWT_SECRET_KEY'] = 'test-secret-key-minimum-32-chars!!'
process.env['REDIS_URL'] = 'redis://localhost:6379'
process.env['JIRA_PROJECT_KEY'] = 'TEST'
