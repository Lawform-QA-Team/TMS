/**
 * CLM 시나리오 정의
 *
 * 각 시나리오는 독립적으로 실행 가능하며,
 * env 필드의 환경변수가 run() 호출 전에 자동으로 주입된다.
 */
import { run as runClmList }     from '../web/clm/clm_list.js';
import { run as runClmDraft }    from '../web/clm/clm_draft.js';
import { run as runClmDetail }   from '../web/clm/clm_detail.js';
import { run as runClmProcess }  from '../web/clm/nomerl/clm_process.js';

export const CLM_SCENARIOS = [
    // ── 기본 조회 ──────────────────────────────────────────────────────
    {
        id: 'CLM-S01',
        name: 'CLM 목록 조회 (초안/검토/완료 탭 전환, 검색, 엑셀 버튼)',
        run: runClmList,
        env: {},
    },
    {
        id: 'CLM-S02',
        name: 'CLM 초안 작성 (신규 검토 요청 버튼 클릭, 임시저장 확인)',
        run: runClmDraft,
        env: {},
    },
    {
        id: 'CLM-S03',
        name: 'CLM 상세 조회 (액션 버튼, 미리보기, 활동 로그)',
        run: runClmDetail,
        env: {},
    },

    // ── 법무 검토 (progress=2) ─────────────────────────────────────────
    {
        id: 'CLM-S04',
        name: 'CLM 법무 검토 승인',
        run: runClmProcess,
        env: { CLM_PROGRESS: '2', APPROVE_TYPE: 'approve' },
    },
    {
        id: 'CLM-S05',
        name: 'CLM 법무 검토 반려',
        run: runClmProcess,
        env: { CLM_PROGRESS: '2', APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 반려 사유' },
    },

    // ── 재무 검토 (progress=3/4) ───────────────────────────────────────
    {
        id: 'CLM-S06',
        name: 'CLM 재무검토 요청 (법무 완료 → 재무 요청)',
        run: runClmProcess,
        env: { CLM_PROGRESS: '3', APPROVE_TYPE: 'request' },
    },
    {
        id: 'CLM-S07',
        name: 'CLM 재무 검토 승인',
        run: runClmProcess,
        env: { CLM_PROGRESS: '4', APPROVE_TYPE: 'approve' },
    },
    {
        id: 'CLM-S08',
        name: 'CLM 재무 검토 반려',
        run: runClmProcess,
        env: { CLM_PROGRESS: '4', APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 재무 반려' },
    },

    // ── 최종 승인 (progress=5) ─────────────────────────────────────────
    {
        id: 'CLM-S09',
        name: 'CLM 최종 승인',
        run: runClmProcess,
        env: { CLM_PROGRESS: '5', APPROVE_TYPE: 'approve' },
    },
    {
        id: 'CLM-S10',
        name: 'CLM 최종 반려',
        run: runClmProcess,
        env: { CLM_PROGRESS: '5', APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 최종 반려' },
    },

    // ── 인감 날인 (progress=6) ─────────────────────────────────────────
    {
        id: 'CLM-S11',
        name: 'CLM 인감사용 신청',
        run: runClmProcess,
        env: { CLM_PROGRESS: '6', SEAL_ACTION: 'request' },
    },
    {
        id: 'CLM-S12',
        name: 'CLM 인감 승인',
        run: runClmProcess,
        env: { CLM_PROGRESS: '6', SEAL_ACTION: 'approve' },
    },
    {
        id: 'CLM-S13',
        name: 'CLM 인감 반려',
        run: runClmProcess,
        env: { CLM_PROGRESS: '6', SEAL_ACTION: 'deny', DENY_REASON: '자동화 테스트 인감 반려' },
    },

    // ── 전자서명 (progress=7) ──────────────────────────────────────────
    {
        id: 'CLM-S14',
        name: 'CLM 전자서명 요청',
        run: runClmProcess,
        env: { CLM_PROGRESS: '7', ESIGN_ACTION: 'request' },
    },
    {
        id: 'CLM-S15',
        name: 'CLM 전자서명 현황 확인',
        run: runClmProcess,
        env: { CLM_PROGRESS: '7', ESIGN_ACTION: 'check' },
    },
];
