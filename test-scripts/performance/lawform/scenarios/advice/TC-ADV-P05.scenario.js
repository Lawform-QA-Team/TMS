/**
 * [TC-ADV-P05] 자문 코멘트 추가 — 성능 측정
 *
 * ENV: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD, ADVICE_ID(optional), COMMENT_TEXT(optional)
 */
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { getFormattedTimestamp } from '@tms/performance/common/utils.js';
import login_to_dashboard from '@tms/performance/common/login/login_to_dashboard.js';
import { gotoDetailOrFirst } from '../../actions/advice/advice.navigate.js';
import { addComment } from '../../actions/advice/advice.review.js';

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
    await page.screenshot({ path: `screenshots/${ts()}_TC-ADV-P05_detail.png` });
    await addComment(page);
    await page.screenshot({ path: `screenshots/${ts()}_TC-ADV-P05_done.png` });
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/:/g, '_');
    return { [`Result/TC-ADV-P05_summary_${timestamp}.html`]: htmlReport(data) };
}
