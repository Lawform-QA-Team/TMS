import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
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

        // 문서 작성 - 기존 문서
        await page.goto(URLS.AUTODOC.EXISTING);
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.WEB.AUTODOC.INPUT_SEARCH, 'heekun');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await page.waitForSelector(SELECTORS.COMMON.TABLE);
        await wait(2000);
        await page.click(`${SELECTORS.WEB.AUTODOC.TABLE_LIST} tbody tr:first-child`);
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_EDIT);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_EDIT);
        await wait(2000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_ai.png` });

        // 문서 작성 - 기존 문서, AI 검토 * 편집, 채팅 입력
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TEXTAREA);
        await page.type(SELECTORS.FEATURES.AUTODOC.TEXTAREA, '조항을 추가해줘');
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SEND);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SEND);
        await wait(15000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_send.png` });

        // 문서 작성 - 기존 문서, AI 검토 * 편집, 자동 검토
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_AUTO_REVIEW);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_AUTO_REVIEW);
        await wait(15000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_auto.png` });

        // 문서 작성 - 기존 문서, AI 검토 * 편집, 코멘트
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_comment.png` });
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_1);

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
        const payload = buildK6SummaryMessage(data, 'Web Autodoc AI');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/web_autodoc_ai_${timestamp}.html`]: htmlReport(data),
    };
}