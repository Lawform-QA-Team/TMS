/**
 * [TC-ADV-P02] 자문 신규 요청 초안 — 성능 측정
 *
 * ENV: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD, ADVICE_TYPE(optional)
 */
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { getFormattedTimestamp } from '@tms/performance/common/utils.js';
import login_to_dashboard from '@tms/performance/common/login/login_to_dashboard.js';
import { gotoDraftList } from '../../actions/advice/advice.navigate.js';
import { clickNewAdviceRequest } from '../../actions/advice/advice.draft.js';

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
    await page.screenshot({ path: `screenshots/${ts()}_TC-ADV-P02_before.png` });
    await clickNewAdviceRequest(page);
    await page.screenshot({ path: `screenshots/${ts()}_TC-ADV-P02_after.png` });
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/:/g, '_');
    return { [`Result/TC-ADV-P02_summary_${timestamp}.html`]: htmlReport(data) };
}
