/**
 * Advice (법률 자문) 시나리오 정의
 */
import { run as runAdviceList }      from '../web/advice/advice_list.js';
import { run as runAdviceDraft }     from '../web/advice/advice_draft.js';
import { run as runAdviceAddComent } from '../web/advice/advice_add_coment.js';
import { run as runAdviceLagel }     from '../web/advice/advice_lagel.js';
import { run as runAdviceProcess }   from '../web/advice/advice_process.js';

export const ADVICE_SCENARIOS = [
    // ── 기본 조회 ──────────────────────────────────────────────────────
    {
        id: 'ADV-S01',
        name: '자문 목록 조회 (목록, 엑셀, 상세, 파일 다운로드)',
        run: runAdviceList,
        env: {},
    },

    // ── 자문 요청 (progress=1) ─────────────────────────────────────────
    {
        id: 'ADV-S02',
        name: '신규 자문 요청 (분류 미선택 — 흐름 확인)',
        run: runAdviceDraft,
        env: {},
    },
    {
        id: 'ADV-S03',
        name: '신규 자문 요청 — 계약 분류 선택',
        run: runAdviceDraft,
        env: { ADVICE_TYPE: 'cn' },
    },
    {
        id: 'ADV-S04',
        name: '신규 자문 요청 — 지재권 분류 선택',
        run: runAdviceDraft,
        env: { ADVICE_TYPE: 'pi' },
    },

    // ── 코멘트 (progress=2) ────────────────────────────────────────────
    {
        id: 'ADV-S05',
        name: '자문 코멘트 추가 (검토 의견 작성)',
        run: runAdviceAddComent,
        env: { COMMENT_TEXT: '자동화 테스트 코멘트입니다.' },
    },

    // ── 법무 처리 (progress=3) ─────────────────────────────────────────
    {
        id: 'ADV-S06',
        name: '자문 법무 완료 승인',
        run: runAdviceLagel,
        env: { APPROVE_TYPE: 'approve' },
    },
    {
        id: 'ADV-S07',
        name: '자문 법무 반려',
        run: runAdviceLagel,
        env: { APPROVE_TYPE: 'deny', DENY_REASON: '자동화 테스트 자문 반려' },
    },

    // ── 전체 프로세스 ──────────────────────────────────────────────────
    {
        id: 'ADV-S08',
        name: '자문 전체 프로세스 — 요청 단계',
        run: runAdviceProcess,
        env: { ADVICE_PROGRESS: '1' },
    },
    {
        id: 'ADV-S09',
        name: '자문 전체 프로세스 — 검토 단계',
        run: runAdviceProcess,
        env: { ADVICE_PROGRESS: '2', COMMENT_TEXT: '자동화 검토 의견' },
    },
    {
        id: 'ADV-S10',
        name: '자문 전체 프로세스 — 완료 처리',
        run: runAdviceProcess,
        env: { ADVICE_PROGRESS: '3', APPROVE_TYPE: 'approve' },
    },
];
