/**
 * 시나리오 파일 → ScenarioRegistry DB 마이그레이션
 */
import { db } from '../src/lib/db.js'

const projectKey = 'LAWFORM'

async function loadActionMap() {
  const actions = await db.actionRegistry.findMany()
  const map: Record<string, number> = {}
  for (const a of actions) {
    map[`${a.category}.${a.name}`] = a.id
    if (!map[a.name]) map[a.name] = a.id
  }
  return map
}

function s(order: number, key: string, params: Record<string, unknown>, am: Record<string, number>) {
  return { order, actionId: am[key] ?? null, _key: key, params }
}

function buildScenarios(am: Record<string, number>) {
  return [
    // ── ADVICE ─────────────────────────────────────────────────────
    {
      name: '[ADV-S01] 자문 목록 조회 (목록, 엑셀, 상세, 파일 다운로드)',
      description: 'ADV-S01: 자문 검토 목록 진입 → 엑셀 버튼 확인 → 첫 번째 항목 상세 진입 → 다운로드/미리보기 버튼 확인',
      category: 'advice',
      steps: [s(1, 'common.login', {}, am), s(2, 'advice.gotoDetailOrFirst', {}, am)],
    },
    {
      name: '[ADV-S02] 신규 자문 요청 (분류 미선택 — 흐름 확인)',
      description: 'ADV-S02: 신규 자문 요청 버튼 클릭 → 분류 미선택 상태로 흐름 확인',
      category: 'advice',
      steps: [s(1, 'common.login', {}, am), s(2, 'advice.clickNewAdviceRequest', {}, am)],
    },
    {
      name: '[ADV-S03] 신규 자문 요청 — 계약 분류 선택',
      description: 'ADV-S03: 신규 자문 요청 → 계약(cn) 분류 선택',
      category: 'advice',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'advice.clickNewAdviceRequest', {}, am),
        s(3, 'advice.selectAdviceType', { ADVICE_TYPE: 'cn' }, am),
      ],
    },
    {
      name: '[ADV-S04] 신규 자문 요청 — 지재권 분류 선택',
      description: 'ADV-S04: 신규 자문 요청 → 지재권(pi) 분류 선택',
      category: 'advice',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'advice.clickNewAdviceRequest', {}, am),
        s(3, 'advice.selectAdviceType', { ADVICE_TYPE: 'pi' }, am),
      ],
    },
    {
      name: '[ADV-S05] 자문 코멘트 추가 (검토 의견 작성)',
      description: 'ADV-S05: 자문 상세 진입 → 코멘트 작성',
      category: 'advice',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'advice.gotoDetailOrFirst', {}, am),
        s(3, 'advice.addComment', { COMMENT_TEXT: '자동화 테스트 코멘트입니다.' }, am),
      ],
    },
    {
      name: '[ADV-S06] 자문 법무 완료 승인',
      description: 'ADV-S06: 자문 상세 진입 → 법무 완료 승인',
      category: 'advice',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'advice.gotoDetailOrFirst', {}, am),
        s(3, 'advice.approveAdvice', { APPROVE_TYPE: 'approve' }, am),
      ],
    },
    {
      name: '[ADV-S07] 자문 법무 반려',
      description: 'ADV-S07: 자문 상세 진입 → 법무 반려',
      category: 'advice',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'advice.gotoDetailOrFirst', {}, am),
        s(3, 'advice.denyAdvice', { APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 자문 반려' }, am),
      ],
    },
    {
      name: '[ADV-S08] 자문 전체 프로세스 — 요청 단계',
      description: 'ADV-S08: 자문 신규 요청 (progress=1)',
      category: 'advice',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'advice.clickNewAdviceRequest', {}, am),
        s(3, 'advice.selectAdviceType', { ADVICE_PROGRESS: '1' }, am),
      ],
    },
    {
      name: '[ADV-S09] 자문 전체 프로세스 — 검토 단계',
      description: 'ADV-S09: 자문 검토 의견 작성 (progress=2)',
      category: 'advice',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'advice.gotoDetailOrFirst', {}, am),
        s(3, 'advice.addComment', { ADVICE_PROGRESS: '2', COMMENT_TEXT: '자동화 검토 의견' }, am),
      ],
    },
    {
      name: '[ADV-S10] 자문 전체 프로세스 — 완료 처리',
      description: 'ADV-S10: 자문 법무 완료 처리 (progress=3)',
      category: 'advice',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'advice.gotoDetailOrFirst', {}, am),
        s(3, 'advice.approveAdvice', { ADVICE_PROGRESS: '3', APPROVE_TYPE: 'approve' }, am),
      ],
    },
    // ── CLM ────────────────────────────────────────────────────────
    {
      name: '[CLM-S01] CLM 목록 조회 (초안/검토/완료 탭 전환, 검색, 엑셀 버튼)',
      description: 'CLM-S01: CLM 목록 페이지 진입 → 탭 전환 → 검색 → 엑셀 버튼 확인',
      category: 'clm',
      steps: [s(1, 'common.login', {}, am), s(2, 'clm.gotoDetailOrFirst', {}, am)],
    },
    {
      name: '[CLM-S02] CLM 초안 작성 (신규 검토 요청 버튼 클릭, 임시저장 확인)',
      description: 'CLM-S02: 신규 검토 요청 버튼 클릭 → 임시저장',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.clickNewReviewRequest', {}, am),
        s(3, 'clm.saveDraft', {}, am),
      ],
    },
    {
      name: '[CLM-S03] CLM 상세 조회 (액션 버튼, 미리보기, 활동 로그)',
      description: 'CLM-S03: CLM 상세 페이지 진입 → 버튼/로그 확인',
      category: 'clm',
      steps: [s(1, 'common.login', {}, am), s(2, 'clm.gotoDetailOrFirst', {}, am)],
    },
    {
      name: '[CLM-S04] CLM 법무 검토 승인',
      description: 'CLM-S04: CLM 상세 → 법무 검토 승인 (progress=2)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.approveLegalReview', { CLM_PROGRESS: '2', APPROVE_TYPE: 'approve' }, am),
      ],
    },
    {
      name: '[CLM-S05] CLM 법무 검토 반려',
      description: 'CLM-S05: CLM 상세 → 법무 검토 반려 (progress=2)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.denyLegalReview', { CLM_PROGRESS: '2', APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 반려 사유' }, am),
      ],
    },
    {
      name: '[CLM-S06] CLM 재무검토 요청 (법무 완료 → 재무 요청)',
      description: 'CLM-S06: CLM 상세 → 재무 검토 요청 (progress=3)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.requestFinancialReview', { CLM_PROGRESS: '3', APPROVE_TYPE: 'request' }, am),
      ],
    },
    {
      name: '[CLM-S07] CLM 재무 검토 승인',
      description: 'CLM-S07: CLM 상세 → 재무 검토 승인 (progress=4)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.approveFinancialReview', { CLM_PROGRESS: '4', APPROVE_TYPE: 'approve' }, am),
      ],
    },
    {
      name: '[CLM-S08] CLM 재무 검토 반려',
      description: 'CLM-S08: CLM 상세 → 재무 검토 반려 (progress=4)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.denyFinancialReview', { CLM_PROGRESS: '4', APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 재무 반려' }, am),
      ],
    },
    {
      name: '[CLM-S09] CLM 최종 승인',
      description: 'CLM-S09: CLM 상세 → 최종 승인 (progress=5)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.approveFinalReview', { CLM_PROGRESS: '5', APPROVE_TYPE: 'approve' }, am),
      ],
    },
    {
      name: '[CLM-S10] CLM 최종 반려',
      description: 'CLM-S10: CLM 상세 → 최종 반려 (progress=5)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.denyFinalReview', { CLM_PROGRESS: '5', APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 최종 반려' }, am),
      ],
    },
    {
      name: '[CLM-S11] CLM 인감사용 신청',
      description: 'CLM-S11: CLM 상세 → 인감사용 신청 (progress=6)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.requestSeal', { CLM_PROGRESS: '6', SEAL_ACTION: 'request' }, am),
      ],
    },
    {
      name: '[CLM-S12] CLM 인감 승인',
      description: 'CLM-S12: CLM 상세 → 인감 승인 (progress=6)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.approveSeal', { CLM_PROGRESS: '6', SEAL_ACTION: 'approve' }, am),
      ],
    },
    {
      name: '[CLM-S13] CLM 인감 반려',
      description: 'CLM-S13: CLM 상세 → 인감 반려 (progress=6)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.denySeal', { CLM_PROGRESS: '6', SEAL_ACTION: 'deny', DENY_REASON: '자동화 테스트 인감 반려' }, am),
      ],
    },
    {
      name: '[CLM-S14] CLM 전자서명 요청',
      description: 'CLM-S14: CLM 상세 → 전자서명 요청 (progress=7)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.requestEsign', { CLM_PROGRESS: '7', ESIGN_ACTION: 'request' }, am),
      ],
    },
    {
      name: '[CLM-S15] CLM 전자서명 현황 확인',
      description: 'CLM-S15: CLM 상세 → 전자서명 현황 확인 (progress=7)',
      category: 'clm',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'clm.gotoDetailOrFirst', {}, am),
        s(3, 'clm.checkEsignStatus', { CLM_PROGRESS: '7', ESIGN_ACTION: 'check' }, am),
      ],
    },
    // ── LITIGATION ─────────────────────────────────────────────────
    {
      name: '[LIT-S01] 송무 신규 등록 (폼 진입 확인)',
      description: 'LIT-S01: 송무 신규 등록 버튼 클릭 → 폼 진입 확인',
      category: 'litigation',
      steps: [s(1, 'common.login', {}, am), s(2, 'litigation.clickNewLitigationButton', {}, am)],
    },
    {
      name: '[LIT-S02] 송무 상세 조회 (편집, 첨부파일, 코멘트 확인)',
      description: 'LIT-S02: 송무 첫 번째 항목 상세 진입 → 버튼/첨부파일/코멘트 확인',
      category: 'litigation',
      steps: [s(1, 'common.login', {}, am), s(2, 'litigation.gotoDetailOrFirst', {}, am)],
    },
    {
      name: '[LIT-S03] 송무 일정 조회',
      description: 'LIT-S03: 송무 상세 → 일정 탭 이동 → 일정 조회',
      category: 'litigation',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'litigation.gotoDetailOrFirst', {}, am),
        s(3, 'litigation.clickScheduleTab', { SCHEDULE_ACTION: 'view' }, am),
      ],
    },
    {
      name: '[LIT-S04] 송무 일정 추가 (추가 모달 진입 확인)',
      description: 'LIT-S04: 송무 상세 → 일정 탭 → 일정 추가 모달 진입',
      category: 'litigation',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'litigation.gotoDetailOrFirst', {}, am),
        s(3, 'litigation.clickScheduleTab', {}, am),
        s(4, 'litigation.openAddScheduleModal', { SCHEDULE_ACTION: 'add' }, am),
      ],
    },
    {
      name: '[LIT-S05] 송무 전체 일정 조회 (월/주/일 뷰 전환)',
      description: 'LIT-S05: 전체 일정 페이지 → 월/주/일 뷰 전환',
      category: 'litigation',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'litigation.switchCalendarView', { VIEW: 'month' }, am),
        s(3, 'litigation.switchCalendarView', { VIEW: 'week' }, am),
        s(4, 'litigation.switchCalendarView', { VIEW: 'day' }, am),
      ],
    },
    // ── MISC ───────────────────────────────────────────────────────
    {
      name: '[MISC-S01] 대시보드 GNB 네비게이션',
      description: 'MISC-S01: 로그인 후 GNB 각 메뉴 클릭 및 이동 확인',
      category: 'misc',
      steps: [s(1, 'common.login', {}, am), s(2, 'misc.gotoDashboard', {}, am)],
    },
    {
      name: '[MISC-S02] 대시보드 설정',
      description: 'MISC-S02: 대시보드 설정 진입 및 위젯 구성 확인',
      category: 'misc',
      steps: [s(1, 'common.login', {}, am), s(2, 'misc.gotoDashboard', {}, am)],
    },
    {
      name: '[MISC-S03] 대량 문서 목록 조회 (검색, 체크박스, 상세)',
      description: 'MISC-S03: 대량 문서 목록 → 검색 → 체크박스 → 상세 진입',
      category: 'misc',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'misc.gotoBulkList', {}, am),
        s(3, 'common.clickFirstRow', {}, am),
      ],
    },
    {
      name: '[MISC-S04] 통계 페이지 조회',
      description: 'MISC-S04: 통계 페이지 진입 및 차트 로드 확인',
      category: 'misc',
      steps: [s(1, 'common.login', {}, am), s(2, 'misc.gotoStatistics', {}, am)],
    },
    {
      name: '[MISC-S05] 결재 흐름 설정 조회',
      description: 'MISC-S05: 시스템 설정 → 결재 흐름 설정 페이지 조회',
      category: 'misc',
      steps: [s(1, 'common.login', {}, am), s(2, 'misc.gotoSetup', {}, am)],
    },
    // ── SEAL ───────────────────────────────────────────────────────
    {
      name: '[SEAL-S01] 인감 목록 조회 (검토 중 / 원장 / 초안)',
      description: 'SEAL-S01: 인감 목록 → 검토 중 / 원장 / 초안 탭 전환',
      category: 'seal',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'seal.gotoReviewList', {}, am),
        s(3, 'seal.gotoLedger', {}, am),
        s(4, 'seal.gotoDraftList', {}, am),
      ],
    },
    {
      name: '[SEAL-S02] 인감 신규 등록 (날짜, 담당자, 첨부파일 영역 확인)',
      description: 'SEAL-S02: 인감 신규 등록 버튼 → 날짜/담당자/첨부파일 입력 영역 확인',
      category: 'seal',
      steps: [
        s(1, 'common.login', {}, am),
        s(2, 'seal.clickNewSealButton', {}, am),
        s(3, 'seal.assertDateInputVisible', {}, am),
        s(4, 'seal.assertContactInputVisible', {}, am),
        s(5, 'seal.assertAttachmentVisible', {}, am),
      ],
    },
  ]
}

async function main() {
  const existing = await db.scenarioRegistry.count()
  if (existing > 0) {
    console.log(`이미 ${existing}개의 시나리오가 존재합니다. 종료합니다.`)
    console.log('재실행하려면 먼저: mysql -u root -p test_management -e "TRUNCATE ScenarioRegistry;"')
    return
  }

  const am = await loadActionMap()
  console.log(`ActionRegistry 로드 완료: ${Object.keys(am).length}개 항목`)

  const scenarios = buildScenarios(am)
  let inserted = 0
  let warned = 0

  for (const sc of scenarios) {
    // 매핑 실패 경고
    for (const step of sc.steps) {
      if ((step as any).actionId === null) {
        console.warn(`  [WARN] "${sc.name}" 단계 ${step.order}: key="${(step as any)._key}" 매핑 실패`)
        warned++
      }
    }

    // _key 제거 후 저장
    const stepsForDB = sc.steps.map(({ order, actionId, params }) => ({ order, actionId, params }))

    await db.scenarioRegistry.create({
      data: {
        name: sc.name,
        description: sc.description,
        category: sc.category,
        steps: JSON.stringify(stepsForDB),
        projectKey,
      },
    })
    inserted++
    process.stdout.write('.')
  }

  console.log(`\n\n완료: ${inserted}개 시나리오 삽입 (경고: ${warned}개 액션 매핑 미완)`)

  const all = await db.scenarioRegistry.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  console.log('\n=== 삽입된 시나리오 ===')
  for (const r of all) {
    const steps = JSON.parse(r.steps) as any[]
    console.log(`  [${r.id}] ${r.category} | ${r.name} (${steps.length}단계)`)
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
