import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const aiExtPageLoad = new Trend('admin_ai_ext_page_load', true);
export const aiExtSearch = new Trend('admin_ai_ext_search', true);
export const aiExtTableClick = new Trend('admin_ai_ext_table_click', true);
export const aiExtDataView = new Trend('admin_ai_ext_data_view', true);
export const aiExtDelete = new Trend('admin_ai_ext_delete', true);

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

export default async function() {
    const context = await browser.newContext({
        viewport: { width: 1600, height: 900 },
    });
    const page = await context.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);

        // AI 외부 데이터 관리 진입 - 법령
        const aiExtPageLoadStart = Date.now();
        await page.goto(URLS.AI_DATA.LAW);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA.png` });
        const aiExtPageLoadDuration = Date.now() - aiExtPageLoadStart;
        aiExtPageLoad.add(aiExtPageLoadDuration);
        console.log(`aiExtPageLoad duration: ${aiExtPageLoadDuration}ms`);
        
        // AI 외부 데이터 관리 - 법령 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // AI 외부 데이터 관리 - 법령 검색
        const aiExtSearchStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH, '고시');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const aiExtSearchDuration = Date.now() - aiExtSearchStart;
        aiExtSearch.add(aiExtSearchDuration);
        console.log(`aiExtSearch duration: ${aiExtSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_search.png` });
        await page.goto(URLS.AI_DATA.LAW);

        // AI 외부 데이터 관리 - 법령 테이블 클릭
        const aiExtTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.TABLE_LIST);
        await page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
        const aiExtTableClickDuration = Date.now() - aiExtTableClickStart;
        aiExtTableClick.add(aiExtTableClickDuration);
        console.log(`aiExtTableClick duration: ${aiExtTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_table.png` });

        // AI 외부 데이터 관리 - 법령 데이터 조회
        const aiExtDataViewStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_VIEW);
        const views = await page.$$(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_VIEW);
        if (views.length >= 2) {
            await views[Math.floor(Math.random() * (views.length - 1)) + 1].click();
        }
        const aiExtDataViewDuration = Date.now() - aiExtDataViewStart;
        aiExtDataView.add(aiExtDataViewDuration);
        console.log(`aiExtDataView duration: ${aiExtDataViewDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_table_detail.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);

        // AI 외부 데이터 관리 - 법령 체크 박스
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_checkbox.png` });
        await page.goto(URLS.AI_DATA.LAW);

        // AI 외부 데이터 관리 - 법령 선택 문서 삭제
        const aiExtDeleteStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
        const aiExtDeleteDuration = Date.now() - aiExtDeleteStart;
        aiExtDelete.add(aiExtDeleteDuration);
        console.log(`aiExtDelete duration: ${aiExtDeleteDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_delete.png` });

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
        const payload = buildK6SummaryMessage(data, 'AI External Data', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/ai_external_data_${timestamp}.html`]: htmlReport(data),
    };
}