import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

const web_autodoc_temp_page_load = new Trend('web_autodoc_temp_page_load');
const web_autodoc_temp_search = new Trend('web_autodoc_temp_search');
const web_autodoc_temp_table_click = new Trend('web_autodoc_temp_table_click');

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

        // 문서 작성 - 임시 저장 문서
        const pageLoadStart = Date.now();
        await page.goto(URLS.AUTODOC.TEMP);
        await wait(2000);
        const pageLoadDuration = Date.now() - pageLoadStart;
        web_autodoc_temp_page_load.add(pageLoadDuration);
        console.log(`[web_autodoc_temp] page_load duration: ${pageLoadDuration}ms`);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp.png` });

        // 문서 작성 - 임시 저장 문서, 페이지네이션
        // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 문서 작성 - 임시 저장 문서, 검색
        const searchStart = Date.now();
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.WEB.AUTODOC.INPUT_SEARCH, 'heekun');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(2000);
        const searchDuration = Date.now() - searchStart;
        web_autodoc_temp_search.add(searchDuration);
        console.log(`[web_autodoc_temp] search duration: ${searchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_search.png` });

        // 문서 작성 - 임시 저장 문서, 테이블 클릭
        const tableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(2000);
        const tableClickDuration = Date.now() - tableClickStart;
        web_autodoc_temp_table_click.add(tableClickDuration);
        console.log(`[web_autodoc_temp] table_click duration: ${tableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_table.png` });
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);

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
        const payload = buildK6SummaryMessage(data, 'Web Autodoc temp', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/web_autodoc_temp_${timestamp}.html`]: htmlReport(data),
    };
}