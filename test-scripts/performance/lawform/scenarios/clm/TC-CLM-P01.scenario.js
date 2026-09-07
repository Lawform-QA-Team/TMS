/**
 * [TC-CLM-P01] CLM 임시저장 목록 조회 — 성능 측정
 *
 * ENV: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { getFormattedTimestamp } from '@tms/performance/common/utils.js';
import login_to_dashboard from '@tms/performance/common/login/login_to_dashboard.js';
import { gotoDraftList } from '../../actions/clm/clm.navigate.js';

export const options = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            options: { browser: { type: 'chromium', defaultViewport: { width: 1920, height: 1080 } } },
        },
    },
    thresholds: { checks: ['rate==1.0'] },
};

export default async function () {
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');
    const page = await login_to_dashboard();
    await gotoDraftList(page);
    await page.screenshot({ path: `screenshots/${ts()}_TC-CLM-P01_draft_list.png` });
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/:/g, '_');
    return { [`Result/TC-CLM-P01_summary_${timestamp}.html`]: htmlReport(data) };
}
