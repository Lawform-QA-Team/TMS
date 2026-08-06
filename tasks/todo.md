# jira-to-qa-automation 내제화 — 1단계 + Pipeline 메뉴

## 완료

- [x] 기존 코드 파악 (jiraClient, jiraPipeline, routes/jira, env, index)
- [x] Step 1: DB 스키마 (CollectedTicket, QAPlan, AutoQaTestCase) — prisma db push 완료
- [x] Step 2: env.ts 환경변수 추가 (QUEUE_NAME, JIRA_CRON_ENABLED, JIRA_CRON_JQL)
- [x] Step 3: ticketNormalizer.ts 신규 (normalizeTicket, adfToPlainText, isQATarget)
- [x] Step 4: jiraClient.ts searchIssuesPaginated async generator 추가
- [x] Step 5: jiraCollectorService.ts 신규 (Redis dedup + DB upsert + BullMQ enqueue)
- [x] Step 6: jiraPipeline.ts 수정 (QUEUE_NAME env 적용, collect-complete 케이스 추가)
- [x] Step 7: jiraCronPoller.ts 신규 (node-cron */5분, JIRA_CRON_ENABLED 조건부 실행)
- [x] Step 8: routes/jira.ts webhook 강화 (isQATarget + collect fire-and-forget)
- [x] Step 9: routes/pipeline.ts 신규 (GET /stats, GET /, GET /:id, POST /:id/cancel)
- [x] Step 10: routes/index.ts + server/index.ts 등록
- [x] Step 11: 프론트엔드 Pipeline 메뉴 (usePipeline, PipelineStats, PipelineList, PipelineDetail, PipelineManager, App.js)
- [x] 검증 (typecheck 통과 + webhook 수집 + 중복방지 + stats + stages API 확인)

## 검증 결과
- npm run typecheck: 에러 없음
- 프론트엔드 빌드: Compiled successfully
- POST /jira/webhook (QAT 프로젝트) → DB 수집 확인
- 중복 webhook 2회 전송 → total = 1 유지
- GET /pipeline/stats → { total: 1, today_count: 1, by_status: { collected: 1 } }
- GET /pipeline/:pipelineId → 8단계 stages 배열 정상 응답

## 다음 단계 (메모)
- 2단계: QAPlan 생성 (Claude API + Slack 승인 게이트) → lib/qaPlanGenerator.ts
- 3단계: AutoQaTestCase 생성 → lib/testCaseGenerator.ts
- 4~9단계: 페이지 분석, 코드생성, 실행, 리포트, 버그등록
