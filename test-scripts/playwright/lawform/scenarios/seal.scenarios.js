/**
 * Seal (인감) 시나리오 정의
 */
import { run as runSealList }  from '../web/seal/seal_list.js';
import { run as runSealDraft } from '../web/seal/seal_draft.js';

export const SEAL_SCENARIOS = [
    {
        id: 'SEAL-S01',
        name: '인감 목록 조회 (검토 중 / 원장 / 초안)',
        run: runSealList,
        env: {},
    },
    {
        id: 'SEAL-S02',
        name: '인감 신규 등록 (날짜, 담당자, 첨부파일 영역 확인)',
        run: runSealDraft,
        env: {},
    },
];
