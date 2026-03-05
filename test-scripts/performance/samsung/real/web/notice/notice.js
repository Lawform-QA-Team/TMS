import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../../admin/login/login_helper.js';
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
        viewport: { width: 1960, height: 1080 },
    });
    const page = await context.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);

        // 공지사항
        await page.goto(URLS.SERVICE.NOTICE);
        await wait(5000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE.png` });

        // 공지사항, 페이지네이션
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_pagination_last.png` });
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 공지사항, 검색
        await page.waitForSelector(SELECTORS.WEB.NOTICE.INPUT_SEARCH);
        await page.type(SELECTORS.WEB.QNA.INPUT_SEARCH, '공지');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_search.png` });
        await page.goto(URLS.SERVICE.NOTICE);

        // 공지사항, 테이블 클릭
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_table.png` });

        // 공지사항, 수정 이력
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history.png` });
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);

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
        const payload = buildK6SummaryMessage(data, 'Web Notice');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/notice_${timestamp}.html`]: htmlReport(data),
    };
}