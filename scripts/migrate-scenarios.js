/**
 * 시나리오 파일 → ScenarioRegistry DB 마이그레이션
 *
 * 각 시나리오의 run 함수가 실행하는 action들을 ActionRegistry ID로 매핑하여 steps 구성.
 */
import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '1q2w#E$R',
  database: 'test_management',
};

// ActionRegistry DB에서 id 조회를 위해 이름→id 매핑 (실행 전 DB에서 로드)
async function loadActionMap(conn) {
  const [rows] = await conn.query('SELECT id, name, category FROM ActionRegistry');
  const map = {};
  for (const row of rows) {
    // "category.name" 복합 키
    map[`${row.category}.${row.name}`] = row.id;
    // name만으로도 접근 (중복 시 마지막 값 — common은 항상 덮어쓰이므로 주의)
    if (!map[row.name]) map[row.name] = row.id;
  }
  return map;
}

function step(order, actionKey, params, am) {
  const actionId = am[actionKey] ?? null;
  return { order, actionId, actionKey, params: params || {} };
}

function buildScenarios(am) {
  const projectKey = 'LAWFORM';

  return [
    // ════════════════════════════════════════════════════════════════
    // ADVICE 시나리오
    // ════════════════════════════════════════════════════════════════
    {
      name: '[ADV-S01] 자문 목록 조회 (목록, 엑셀, 상세, 파일 다운로드)',
      description: 'ADV-S01: 자문 검토 목록 진입 → 엑셀 버튼 확인 → 첫 번째 항목 상세 진입 → 다운로드/미리보기 버튼 확인',
      category: 'advice',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'advice.gotoDetailOrFirst', {}, am),
      ],
    },
    {
      name: '[ADV-S02] 신규 자문 요청 (분류 미선택 — 흐름 확인)',
      description: 'ADV-S02: 신규 자문 요청 버튼 클릭 → 분류 미선택 상태로 흐름 확인',
      category: 'advice',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'advice.clickNewAdviceRequest', {}, am),
      ],
    },
    {
      name: '[ADV-S03] 신규 자문 요청 — 계약 분류 선택',
      description: 'ADV-S03: 신규 자문 요청 → 계약(cn) 분류 선택',
      category: 'advice',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'advice.clickNewAdviceRequest', {}, am),
        step(3, 'advice.selectAdviceType', { ADVICE_TYPE: 'cn' }, am),
      ],
    },
    {
      name: '[ADV-S04] 신규 자문 요청 — 지재권 분류 선택',
      description: 'ADV-S04: 신규 자문 요청 → 지재권(pi) 분류 선택',
      category: 'advice',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'advice.clickNewAdviceRequest', {}, am),
        step(3, 'advice.selectAdviceType', { ADVICE_TYPE: 'pi' }, am),
      ],
    },
    {
      name: '[ADV-S05] 자문 코멘트 추가 (검토 의견 작성)',
      description: 'ADV-S05: 자문 상세 진입 → 코멘트 작성',
      category: 'advice',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'advice.gotoDetailOrFirst', {}, am),
        step(3, 'advice.addComment', { COMMENT_TEXT: '자동화 테스트 코멘트입니다.' }, am),
      ],
    },
    {
      name: '[ADV-S06] 자문 법무 완료 승인',
      description: 'ADV-S06: 자문 상세 진입 → 법무 완료 승인',
      category: 'advice',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'advice.gotoDetailOrFirst', {}, am),
        step(3, 'advice.approveAdvice', { APPROVE_TYPE: 'approve' }, am),
      ],
    },
    {
      name: '[ADV-S07] 자문 법무 반려',
      description: 'ADV-S07: 자문 상세 진입 → 법무 반려',
      category: 'advice',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'advice.gotoDetailOrFirst', {}, am),
        step(3, 'advice.denyAdvice', { APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 자문 반려' }, am),
      ],
    },
    {
      name: '[ADV-S08] 자문 전체 프로세스 — 요청 단계',
      description: 'ADV-S08: 자문 신규 요청 (progress=1)',
      category: 'advice',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'advice.clickNewAdviceRequest', {}, am),
        step(3, 'advice.selectAdviceType', { ADVICE_PROGRESS: '1' }, am),
      ],
    },
    {
      name: '[ADV-S09] 자문 전체 프로세스 — 검토 단계',
      description: 'ADV-S09: 자문 검토 의견 작성 (progress=2)',
      category: 'advice',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'advice.gotoDetailOrFirst', {}, am),
        step(3, 'advice.addComment', { ADVICE_PROGRESS: '2', COMMENT_TEXT: '자동화 검토 의견' }, am),
      ],
    },
    {
      name: '[ADV-S10] 자문 전체 프로세스 — 완료 처리',
      description: 'ADV-S10: 자문 법무 완료 처리 (progress=3)',
      category: 'advice',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'advice.gotoDetailOrFirst', {}, am),
        step(3, 'advice.approveAdvice', { ADVICE_PROGRESS: '3', APPROVE_TYPE: 'approve' }, am),
      ],
    },

    // ════════════════════════════════════════════════════════════════
    // CLM 시나리오
    // ════════════════════════════════════════════════════════════════
    {
      name: '[CLM-S01] CLM 목록 조회 (초안/검토/완료 탭 전환, 검색, 엑셀 버튼)',
      description: 'CLM-S01: CLM 목록 페이지 진입 → 탭 전환 → 검색 → 엑셀 버튼 확인',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
      ],
    },
    {
      name: '[CLM-S02] CLM 초안 작성 (신규 검토 요청 버튼 클릭, 임시저장 확인)',
      description: 'CLM-S02: 신규 검토 요청 버튼 클릭 → 임시저장',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.clickNewReviewRequest', {}, am),
        step(3, 'clm.saveDraft', {}, am),
      ],
    },
    {
      name: '[CLM-S03] CLM 상세 조회 (액션 버튼, 미리보기, 활동 로그)',
      description: 'CLM-S03: CLM 상세 페이지 진입 → 버튼/로그 확인',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
      ],
    },
    {
      name: '[CLM-S04] CLM 법무 검토 승인',
      description: 'CLM-S04: CLM 상세 → 법무 검토 승인 (progress=2)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.approveLegalReview', { CLM_PROGRESS: '2', APPROVE_TYPE: 'approve' }, am),
      ],
    },
    {
      name: '[CLM-S05] CLM 법무 검토 반려',
      description: 'CLM-S05: CLM 상세 → 법무 검토 반려 (progress=2)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.denyLegalReview', { CLM_PROGRESS: '2', APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 반려 사유' }, am),
      ],
    },
    {
      name: '[CLM-S06] CLM 재무검토 요청 (법무 완료 → 재무 요청)',
      description: 'CLM-S06: CLM 상세 → 재무 검토 요청 (progress=3)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.requestFinancialReview', { CLM_PROGRESS: '3', APPROVE_TYPE: 'request' }, am),
      ],
    },
    {
      name: '[CLM-S07] CLM 재무 검토 승인',
      description: 'CLM-S07: CLM 상세 → 재무 검토 승인 (progress=4)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.approveFinancialReview', { CLM_PROGRESS: '4', APPROVE_TYPE: 'approve' }, am),
      ],
    },
    {
      name: '[CLM-S08] CLM 재무 검토 반려',
      description: 'CLM-S08: CLM 상세 → 재무 검토 반려 (progress=4)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.denyFinancialReview', { CLM_PROGRESS: '4', APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 재무 반려' }, am),
      ],
    },
    {
      name: '[CLM-S09] CLM 최종 승인',
      description: 'CLM-S09: CLM 상세 → 최종 승인 (progress=5)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.approveFinalReview', { CLM_PROGRESS: '5', APPROVE_TYPE: 'approve' }, am),
      ],
    },
    {
      name: '[CLM-S10] CLM 최종 반려',
      description: 'CLM-S10: CLM 상세 → 최종 반려 (progress=5)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.denyFinalReview', { CLM_PROGRESS: '5', APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 최종 반려' }, am),
      ],
    },
    {
      name: '[CLM-S11] CLM 인감사용 신청',
      description: 'CLM-S11: CLM 상세 → 인감사용 신청 (progress=6)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.requestSeal', { CLM_PROGRESS: '6', SEAL_ACTION: 'request' }, am),
      ],
    },
    {
      name: '[CLM-S12] CLM 인감 승인',
      description: 'CLM-S12: CLM 상세 → 인감 승인 (progress=6)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.approveSeal', { CLM_PROGRESS: '6', SEAL_ACTION: 'approve' }, am),
      ],
    },
    {
      name: '[CLM-S13] CLM 인감 반려',
      description: 'CLM-S13: CLM 상세 → 인감 반려 (progress=6)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.denySeal', { CLM_PROGRESS: '6', SEAL_ACTION: 'deny', DENY_REASON: '자동화 테스트 인감 반려' }, am),
      ],
    },
    {
      name: '[CLM-S14] CLM 전자서명 요청',
      description: 'CLM-S14: CLM 상세 → 전자서명 요청 (progress=7)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.requestEsign', { CLM_PROGRESS: '7', ESIGN_ACTION: 'request' }, am),
      ],
    },
    {
      name: '[CLM-S15] CLM 전자서명 현황 확인',
      description: 'CLM-S15: CLM 상세 → 전자서명 현황 확인 (progress=7)',
      category: 'clm',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'clm.gotoDetailOrFirst', {}, am),
        step(3, 'clm.checkEsignStatus', { CLM_PROGRESS: '7', ESIGN_ACTION: 'check' }, am),
      ],
    },

    // ════════════════════════════════════════════════════════════════
    // LITIGATION 시나리오
    // ════════════════════════════════════════════════════════════════
    {
      name: '[LIT-S01] 송무 신규 등록 (폼 진입 확인)',
      description: 'LIT-S01: 송무 신규 등록 버튼 클릭 → 폼 진입 확인',
      category: 'litigation',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'litigation.clickNewLitigationButton', {}, am),
      ],
    },
    {
      name: '[LIT-S02] 송무 상세 조회 (편집, 첨부파일, 코멘트 확인)',
      description: 'LIT-S02: 송무 첫 번째 항목 상세 진입 → 버튼/첨부파일/코멘트 확인',
      category: 'litigation',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'litigation.gotoDetailOrFirst', {}, am),
      ],
    },
    {
      name: '[LIT-S03] 송무 일정 조회',
      description: 'LIT-S03: 송무 상세 → 일정 탭 이동 → 일정 조회',
      category: 'litigation',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'litigation.gotoDetailOrFirst', {}, am),
        step(3, 'litigation.clickScheduleTab', { SCHEDULE_ACTION: 'view' }, am),
      ],
    },
    {
      name: '[LIT-S04] 송무 일정 추가 (추가 모달 진입 확인)',
      description: 'LIT-S04: 송무 상세 → 일정 탭 → 일정 추가 모달 진입',
      category: 'litigation',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'litigation.gotoDetailOrFirst', {}, am),
        step(3, 'litigation.clickScheduleTab', {}, am),
        step(4, 'litigation.openAddScheduleModal', { SCHEDULE_ACTION: 'add' }, am),
      ],
    },
    {
      name: '[LIT-S05] 송무 전체 일정 조회 (월/주/일 뷰 전환)',
      description: 'LIT-S05: 전체 일정 페이지 → 월/주/일 뷰 전환',
      category: 'litigation',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'litigation.switchCalendarView', { VIEW: 'month' }, am),
        step(3, 'litigation.switchCalendarView', { VIEW: 'week' }, am),
        step(4, 'litigation.switchCalendarView', { VIEW: 'day' }, am),
      ],
    },

    // ════════════════════════════════════════════════════════════════
    // MISC 시나리오
    // ════════════════════════════════════════════════════════════════
    {
      name: '[MISC-S01] 대시보드 GNB 네비게이션',
      description: 'MISC-S01: 로그인 후 GNB 각 메뉴 클릭 및 이동 확인',
      category: 'misc',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'misc.gotoDashboard', {}, am),
      ],
    },
    {
      name: '[MISC-S02] 대시보드 설정',
      description: 'MISC-S02: 대시보드 설정 진입 및 위젯 구성 확인',
      category: 'misc',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'misc.gotoDashboard', {}, am),
      ],
    },
    {
      name: '[MISC-S03] 대량 문서 목록 조회 (검색, 체크박스, 상세)',
      description: 'MISC-S03: 대량 문서 목록 → 검색 → 체크박스 → 상세 진입',
      category: 'misc',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'misc.gotoBulkList', {}, am),
        step(3, 'common.clickFirstRow', {}, am),
      ],
    },
    {
      name: '[MISC-S04] 통계 페이지 조회',
      description: 'MISC-S04: 통계 페이지 진입 및 차트 로드 확인',
      category: 'misc',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'misc.gotoStatistics', {}, am),
      ],
    },
    {
      name: '[MISC-S05] 결재 흐름 설정 조회',
      description: 'MISC-S05: 시스템 설정 → 결재 흐름 설정 페이지 조회',
      category: 'misc',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'misc.gotoSetup', {}, am),
      ],
    },

    // ════════════════════════════════════════════════════════════════
    // SEAL 시나리오
    // ════════════════════════════════════════════════════════════════
    {
      name: '[SEAL-S01] 인감 목록 조회 (검토 중 / 원장 / 초안)',
      description: 'SEAL-S01: 인감 목록 → 검토 중 / 원장 / 초안 탭 전환',
      category: 'seal',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'seal.gotoReviewList', {}, am),
        step(3, 'seal.gotoLedger', {}, am),
        step(4, 'seal.gotoDraftList', {}, am),
      ],
    },
    {
      name: '[SEAL-S02] 인감 신규 등록 (날짜, 담당자, 첨부파일 영역 확인)',
      description: 'SEAL-S02: 인감 신규 등록 버튼 → 날짜/담당자/첨부파일 입력 영역 확인',
      category: 'seal',
      projectKey,
      steps: [
        step(1, 'common.login', {}, am),
        step(2, 'seal.clickNewSealButton', {}, am),
        step(3, 'seal.assertDateInputVisible', {}, am),
        step(4, 'seal.assertContactInputVisible', {}, am),
        step(5, 'seal.assertAttachmentVisible', {}, am),
      ],
    },
  ];
}

async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('DB 연결 완료');

  try {
    // 기존 데이터 확인
    const [existing] = await conn.query('SELECT COUNT(*) as cnt FROM ScenarioRegistry');
    if (existing[0].cnt > 0) {
      console.log(`이미 ${existing[0].cnt}개의 시나리오가 존재합니다. 중복 삽입을 방지하기 위해 종료합니다.`);
      console.log('강제로 재실행하려면 ScenarioRegistry 테이블을 먼저 비워주세요: TRUNCATE ScenarioRegistry;');
      return;
    }

    const am = await loadActionMap(conn);
    console.log(`ActionRegistry 로드 완료: ${Object.keys(am).length}개 항목`);

    const scenarios = buildScenarios(am);
    let inserted = 0;
    let warned = 0;

    for (const s of scenarios) {
      // steps에 actionId null인 항목 경고
      for (const step of s.steps) {
        if (step.actionId === null) {
          console.warn(`  [WARN] "${s.name}" - 단계 ${step.order}: actionKey="${step.actionKey}" 매핑 실패`);
          warned++;
        }
      }

      // actionKey는 저장하지 않고 actionId만 저장
      const stepsForDB = s.steps.map(({ order, actionId, params }) => ({ order, actionId, params }));

      await conn.query(
        `INSERT INTO ScenarioRegistry (name, description, category, steps, project_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [s.name, s.description, s.category, JSON.stringify(stepsForDB), s.projectKey]
      );
      inserted++;
    }

    console.log(`\n완료: ${inserted}개 시나리오 삽입 (경고: ${warned}개 액션 매핑 미완)`);

    // 삽입 결과 확인
    const [result] = await conn.query(
      'SELECT id, name, category, JSON_LENGTH(steps) as step_count FROM ScenarioRegistry ORDER BY category, name'
    );
    console.log('\n=== 삽입된 시나리오 목록 ===');
    for (const r of result) {
      console.log(`  [${r.id}] ${r.category} | ${r.name} (${r.step_count}단계)`);
    }

  } finally {
    await conn.end();
  }
}

main().catch(console.error);
