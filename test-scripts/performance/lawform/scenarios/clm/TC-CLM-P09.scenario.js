/**
 * [TC-CLM-P09] CLM 최종 승인 — 성능 측정
 *
 * ENV: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD, CLM_ID(optional)
 */
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { getFormattedTimestamp } from '@tms/performance/common/utils.js';
import login_to_dashboard from '@tms/performance/common/login/login_to_dashboard.js';
import { gotoDetailOrFirst } from '../../actions/clm/clm.navigate.js';
import { approveFinalReview } from '../../actions/clm/clm.final.js';

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
    const entered = await gotoDetailOrFirst(page);
    if (!entered) return;
    await page.screenshot({ path: `screenshots/${ts()}_TC-CLM-P09_detail.png` });
    await approveFinalReview(page);
    await page.screenshot({ path: `screenshots/${ts()}_TC-CLM-P09_done.png` });
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/:/g, '_');
    return { [`Result/TC-CLM-P09_summary_${timestamp}.html`]: htmlReport(data) };
}
