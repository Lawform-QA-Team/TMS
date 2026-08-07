# 페이즈 2: QAPlan 생성 + Slack 승인 게이트

## 구현 목록

- [x] lib/qaPlanGenerator.ts — Claude API로 QA Plan JSON 생성
- [x] lib/slackNotifier.ts — Slack Bot API (fetch 기반, 승인 버튼 메시지)
- [x] lib/jiraPipeline.ts — collect-complete 케이스에서 qaplan 생성 연결
- [x] routes/slack.ts — POST /slack/interaction (승인/거절 처리)
- [x] routes/index.ts — slackRouter 등록
- [x] 프론트엔드 PipelineDetail — qaplan 단계 + planContent 표시
- [x] 검증 — webhook → Claude API → QAPlan DB 저장 → pipelineStatus=qaplan 확인
