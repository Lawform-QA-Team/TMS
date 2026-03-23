/*
    최초 로그인 시도 시 개인정보 처리 방침 동의 절차
*/

import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { browser } from "k6/browser"
import { getFormattedTimestamp } from "../../../../common/utils.js"
import { getCredentials, loginWithPage } from './login_helper.js'
import { SELECTORS } from "../../selector_sam.js"
import { URLS } from "../../url_base_sam.js"
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from "../../../../common/slack_helper.js"

const scriptErrors = [];

export const options = {
    scenarios: {
        ui: {
            executor: "shared-iterations",
            vus: 1,
            iterations: 1,
        }
    },
    thresholds: {
        checks: ['rate==1.0'],
    },
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
        await page.waitForSelector();
        await page.click();
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
        const payload = buildK6SummaryMessage(data, 'Accept Login', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/accept_login_${timestamp}.html`]: htmlReport(data),
    };
}