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
    const context = await browser.newContext({
        acceptDownloads: true,
        behavior: 'allow',
        downloadsPath: './downloads',
        viewport: { width: 1960, height: 1080 },
    });
    const page = await context.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);

        // 통합검색
        await page.waitForSelector(SELECTORS.WEB.NAVBAR.INPUT);
        await page.type(SELECTORS.WEB.NAVBAR.INPUT, '테스트');
        await page.keyboard.press('Enter');
        await wait(2000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SEARCH.png` });

        // 통합검색, 페이지네이션
        // await page.waitForSelector(SELECTORS.WEB.SEARCH.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_SEARCH_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.WEB.SEARCH.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 통합검색, 검색 필터 적용
        await selectComboboxOption(page, SELECTORS.WEB.SEARCH.SELECT)
        await page.waitForSelector(SELECTORS.WEB.SEARCH.INPUT);
        await page.fill(SELECTORS.WEB.SEARCH.INPUT, 'heekun');
        await page.waitForSelector(SELECTORS.WEB.SEARCH.DATEPICKER);
        await page.waitForSelector(SELECTORS.WEB.SEARCH.DATEPICKER_START);
        await selectDateRangeInRdpCalendar(page, SELECTORS.WEB.SEARCH.DATEPICKER, SELECTORS.WEB.SEARCH.DATEPICKER_START, '2026-03-01', '2026-03-31')
        await page.waitForSelector(SELECTORS.WEB.SEARCH.BUTTON_FILTER_SEARCH);
        await page.click(SELECTORS.WEB.SEARCH.BUTTON_FILTER_SEARCH);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SEARCH_filter.png` });

        // 통합검색, 검색 결과 클릭
        await page.goto(URLS.DRIVE.DRIVE);
        await page.waitForSelector(SELECTORS.WEB.NAVBAR.INPUT);
        await page.type(SELECTORS.WEB.NAVBAR.INPUT, '테스트');
        await page.keyboard.press('Enter');
        await wait(2000);
        const results = await page.$$('button.text-base.font-semibold.text-foreground.hover\\:text-primary.cursor-pointer.text-left');
        await results[0].click();
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SEARCH_result.png` });

    } finally {
        if (page) await page.close();
        if (context) await context.close();
    }
}
 
export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');

    // 결과 추출 및 Slack 발송
    const slackWebhookUrl = __ENV.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
        const payload = buildK6SummaryMessage(data, 'Web Search');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/web_search_${timestamp}.html`]: htmlReport(data),
    };
}