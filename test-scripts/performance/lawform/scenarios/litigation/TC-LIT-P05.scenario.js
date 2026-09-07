/**
 * [TC-LIT-P05] 송무 전체 일정 조회 — 성능 측정
 *
 * ENV: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { getFormattedTimestamp } from '@tms/performance/common/utils.js';
import login_to_dashboard from '@tms/performance/common/login/login_to_dashboard.js';
import { gotoScheduleAll } from '../../actions/litigation/litigation.navigate.js';
import { switchCalendarView } from '../../actions/litigation/litigation.schedule.js';

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
    await gotoScheduleAll(page);
    await page.screenshot({ path: `screenshots/${ts()}_TC-LIT-P05_schedule_all.png` });
    await switchCalendarView(page, '월');
    await page.screenshot({ path: `screenshots/${ts()}_TC-LIT-P05_month.png` });
    await switchCalendarView(page, '주');
    await page.screenshot({ path: `screenshots/${ts()}_TC-LIT-P05_week.png` });
    await switchCalendarView(page, '일');
    await page.screenshot({ path: `screenshots/${ts()}_TC-LIT-P05_day.png` });
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/:/g, '_');
    return { [`Result/TC-LIT-P05_summary_${timestamp}.html`]: htmlReport(data) };
}
