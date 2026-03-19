# Task: k6 메트릭 이중 계산 버그 수정

## 배경
방금 추가한 Trend 메트릭 코드에서 lessons.md에 기록된 패턴 오류 발생:
- `metric.add(Date.now() - start)` 이후 `console.log`에서 `Date.now()`를 다시 호출 → 값 불일치

## 수정 계획

### 수정 대상 (admin + web, 24개 파일)
- [ ] admin/ai_chat_data/ai_chat_data.js
- [ ] admin/ai_chat_data/ai_chat_data_preset.js
- [ ] admin/ai_external_data/ai_external_data.js
- [ ] admin/ai_external_data/ai_external_data_company.js
- [ ] admin/autodoc/autodoc.js
- [ ] admin/autodoc/autodoc_category.js
- [ ] admin/autodoc/autodoc_tool.js
- [ ] admin/dashboard/dashboard.js
- [ ] admin/document_update_report/document_update_report.js
- [ ] admin/document_update_report/document_update_report_other.js
- [ ] admin/filtering/filtering.js
- [ ] admin/ip_management/ip_management.js
- [ ] admin/log/log.js
- [ ] admin/members/members.js
- [ ] admin/members/members_service.js
- [ ] admin/notice/notice.js
- [ ] admin/qna/qna_search.js
- [ ] web/drive/drive.js
- [ ] web/notice/notice.js
- [ ] web/qna/qna.js
- [ ] web/search/search.js
- [ ] web/autodoc/autodoc.js
- [ ] web/autodoc/autodoc_existing.js
- [ ] web/autodoc/autodoc_temp.js

### 수정 방법
잘못된 패턴:
```js
metric.add(Date.now() - start);
console.log(`... ${Date.now() - start}ms`);
```

올바른 패턴:
```js
const duration = Date.now() - start;
metric.add(duration);
console.log(`... ${duration}ms`);
```

## 검증
- 각 파일에서 `Date.now()` 중복 호출이 없는지 확인
- `duration` 변수를 재사용하는 패턴으로 통일됐는지 확인

## 완료
- [ ] 전체 수정 완료
- [ ] 검증 완료
