/**
 * Litigation (송무) 시나리오 정의
 */
import { run as runLitigationDraft }       from '../web/litigation/litigation_draft.js';
import { run as runLitigationDetail }      from '../web/litigation/litigation_detail.js';
import { run as runLitigationSchedule }    from '../web/litigation/litigation_schedule.js';
import { run as runLitigationScheduleAll } from '../web/litigation/litigation_schedule.all.js';

export const LITIGATION_SCENARIOS = [
    // ── 등록 ───────────────────────────────────────────────────────────
    {
        id: 'LIT-S01',
        name: '송무 신규 등록 (폼 진입 확인)',
        run: runLitigationDraft,
        env: {},
    },

    // ── 상세 조회 ──────────────────────────────────────────────────────
    {
        id: 'LIT-S02',
        name: '송무 상세 조회 (편집, 첨부파일, 코멘트 확인)',
        run: runLitigationDetail,
        env: {},
    },

    // ── 일정 관리 ──────────────────────────────────────────────────────
    {
        id: 'LIT-S03',
        name: '송무 일정 조회',
        run: runLitigationSchedule,
        env: { SCHEDULE_ACTION: 'view' },
    },
    {
        id: 'LIT-S04',
        name: '송무 일정 추가 (추가 모달 진입 확인)',
        run: runLitigationSchedule,
        env: { SCHEDULE_ACTION: 'add' },
    },
    {
        id: 'LIT-S05',
        name: '송무 전체 일정 조회 (월/주/일 뷰 전환)',
        run: runLitigationScheduleAll,
        env: {},
    },
];
