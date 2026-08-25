/**
 * [TC-LIT-P02] 송무 신규 등록 초안 — 성능 측정
 *
 * ENV: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { getFormattedTimestamp } from '@tms/performance/common/utils.js';
import login_to_dashboard from '@tms/performance/common/login/login_to_dashboard.js';
import { gotoDraftList } from '../../actions/litigation/litigation.navigate.js';
import { clickNewLitigationButton } from '../../actions/litigation/litigation.draft.js';

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
    await page.screenshot({ path: `screenshots/${ts()}_TC-LIT-P02_before.png` });
    await clickNewLitigationButton(page);
    await page.screenshot({ path: `screenshots/${ts()}_TC-LIT-P02_after.png` });
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/:/g, '_');
    return { [`Result/TC-LIT-P02_summary_${timestamp}.html`]: htmlReport(data) };
}
