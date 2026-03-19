import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { sendSlackWebhook, buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

const admin_autodoc_tool_login = new Trend('admin_autodoc_tool_login');

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
        const loginStart = Date.now();
        await loginWithPage(page, credentials);
        const loginDuration = Date.now() - loginStart;
        admin_autodoc_tool_login.add(loginDuration);
        console.log(`[admin_autodoc_tool] login duration: ${loginDuration}ms`);

        // // 미완성 상태
        // // 표준 양식 관리 등록 진입
        // await page.goto(URLS.AUTODOC.NEW + "1");
        // let timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL.png` });
        // await wait(2000);
        
        // // 본문 제목
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.INPUT);
        // await page.type(SELECTORS.ADMIN.AUTODOC_TOOL.INPUT, '표준 양식 테스트');
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_input.png` });

        // // 최상단 인풋 섹션 추가
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_TOP_INPUT_SECTION);
        // await page.click(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_TOP_INPUT_SECTION);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_add_input_section.png` });

        // // 섹션 추가
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_SECTION);
        // await page.click(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_SECTION);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_add_section.png` });

        // // 섹션 추가
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_REMOVE_SECTION);
        // await page.click(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_REMOVE_SECTION);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_remove_section.png` });
        
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
        const payload = buildK6SummaryMessage(data, 'Autodoc Tool');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/autodoc_tool_${timestamp}.html`]: htmlReport(data),
    };
}