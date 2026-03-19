import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

const admin_autodoc_tool_login = new Trend('admin_autodoc_tool_login');

const scriptErrors = [];

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
        
    } catch (e) {
        scriptErrors.push({ message: e.message || String(e), stack: e.stack, time: new Date().toISOString() });
        throw e;
    } finally {
        if (page) await page.close();
        if (context) await context.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');

    // Slack Bot API 발송
    const token = __ENV.SLACK_BOT_TOKEN;
    const channel = __ENV.SLACK_CHANNEL_ID;
    if (token && channel) {
        const payload = buildK6SummaryMessage(data, 'Autodoc Tool', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/autodoc_tool_${timestamp}.html`]: htmlReport(data),
    };
}