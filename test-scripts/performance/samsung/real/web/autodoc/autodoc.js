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

        // 문서 작성 - 표준 양식
        await page.goto(URLS.AUTODOC.AUTODOC);
        await wait(5000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC.png` });

        // 문서 작성 - 표준 양식, 페이지네이션
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 문서 작성 - 표준 양식, 검색
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.WEB.AUTODOC.INPUT_SEARCH, '테스트');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_search.png` });
        await page.goto(URLS.AUTODOC.AUTODOC);

        // 문서 작성 - 표준 양식, 테이블 클릭
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_table.png` });
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
        await page.goto(URLS.AUTODOC.AUTODOC);

        // 문서 작성 - 표준 양식, 작성
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
            // 내용을 작성했다고 가정
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_write.png` });

        // 문서 작성 - 표준 양식, 임시저장
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DRAFT_SAVE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DRAFT_SAVE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_submit.png` });

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
        const payload = buildK6SummaryMessage(data, 'Web Autodoc');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/notice_${timestamp}.html`]: htmlReport(data),
    };
}