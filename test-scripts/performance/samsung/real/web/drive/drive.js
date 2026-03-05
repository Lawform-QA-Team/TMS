import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../../admin/login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { selectDateRangeInRdpCalendar } from '../../../../common/datepicker_helper.js';
import { sendSlackWebhook, buildK6SummaryMessage } from '../../../../common/slack_helper.js';

export const options = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            vus: 1,
            iterations: 1,
            options: {
                browser: {
                    type: 'chromium',
                },
            },
        },
    },
    thresholds: {
        checks: ['rate==1.0'],
    },
};

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function() {
    const page = await browser.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);

        // 문서 조회
        await page.goto(URLS.DRIVE.DRIVE);
        await wait(5000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DRIVE.png` });

        // 문서 조회, 페이지네이션
        await page.waitForSelector(SELECTORS.WEB.DRIVE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_pagination_last.png` });
        await page.waitForSelector(SELECTORS.WEB.DRIVE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 문서 조회, 검색
        await selectComboboxOption(page, SELECTORS.WEB.DRIVE.SELECT_CATEGORY);
        await selectDateRangeInRdpCalendar(page, DATEPICKER, DATEPICKER_START, '2026-02-01', '2026-02-28')
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.WEB.AUTODOC.INPUT_SEARCH, '테스트');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_search.png` });
        await page.goto(URLS.DRIVE.DRIVE);

        // 문서 조회, 테이블 클릭
        await page.waitForSelector(SELECTORS.WEB.DRIVE.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_table.png` });

    } finally {
        await page.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');

    // 결과 추출 및 Slack 발송
    const slackWebhookUrl = __ENV.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
        const payload = buildK6SummaryMessage(data, 'Web Drive');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/notice_${timestamp}.html`]: htmlReport(data),
    };
}