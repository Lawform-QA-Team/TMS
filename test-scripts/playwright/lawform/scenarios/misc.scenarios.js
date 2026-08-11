/**
 * 기타 도메인 시나리오 정의 (대량 문서 / 통계 / 설정 / 대시보드)
 */
import { run as runBulkList }         from '../web/bulk/bulk_list.js';
import { run as runStatisticsView }   from '../web/statistics/statistics_view.js';
import { run as runSetupView }        from '../web/setup/setup_view.js';
import { run as runDashboardSetting } from '../web/dashboard/dashboard_setting.js';
import { run as runGnbClick }         from '../web/dashboard/GNB_click.js';

export const MISC_SCENARIOS = [
    // ── 대시보드 ───────────────────────────────────────────────────────
    {
        id: 'MISC-S01',
        name: '대시보드 GNB 네비게이션',
        run: runGnbClick,
        env: {},
    },
    {
        id: 'MISC-S02',
        name: '대시보드 설정',
        run: runDashboardSetting,
        env: {},
    },

    // ── 대량 문서 ──────────────────────────────────────────────────────
    {
        id: 'MISC-S03',
        name: '대량 문서 목록 조회 (검색, 체크박스, 상세)',
        run: runBulkList,
        env: {},
    },

    // ── 통계 ───────────────────────────────────────────────────────────
    {
        id: 'MISC-S04',
        name: '통계 페이지 조회',
        run: runStatisticsView,
        env: {},
    },

    // ── 시스템 설정 ────────────────────────────────────────────────────
    {
        id: 'MISC-S05',
        name: '결재 흐름 설정 조회',
        run: runSetupView,
        env: {},
    },
];
