import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const adminIpPageLoad = new Trend('admin_ip_page_load', true);
export const adminIpSearch = new Trend('admin_ip_search', true);

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
        await loginWithPage(page, credentials);

        // IP 관리
        const adminIpPageLoadStart = Date.now();
        await page.goto(URLS.SERVICE.IP);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_IP.png` });
        await wait(2000);
        const adminIpPageLoadDuration = Date.now() - adminIpPageLoadStart;
        adminIpPageLoad.add(adminIpPageLoadDuration);
        console.log(`Admin IP page load duration: ${adminIpPageLoadDuration}ms`);

        // IP 관리, 검색
        await page.waitForSelector(SELECTORS.ADMIN.IP_MANAGEMENT.INPUT_SEARCH);
        const adminIpSearchStart = Date.now();
        await page.type(SELECTORS.ADMIN.IP_MANAGEMENT.INPUT_SEARCH, '5');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(2000);
        const adminIpSearchDuration = Date.now() - adminIpSearchStart;
        adminIpSearch.add(adminIpSearchDuration);
        console.log(`Admin IP search duration: ${adminIpSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_IP_search.png` });

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
        const payload = buildK6SummaryMessage(data, 'IP Management', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/ip_management_${timestamp}.html`]: htmlReport(data),
    };
}