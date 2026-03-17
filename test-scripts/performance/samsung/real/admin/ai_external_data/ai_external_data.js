import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { sendSlackWebhook, buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const aiExtPageLoad = new Trend('admin_ai_ext_page_load', true);
export const aiExtSearch = new Trend('admin_ai_ext_search', true);
export const aiExtTableClick = new Trend('admin_ai_ext_table_click', true);
export const aiExtDataView = new Trend('admin_ai_ext_data_view', true);
export const aiExtDelete = new Trend('admin_ai_ext_delete', true);

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
        await wait(2000);
        aiExtPageLoad.add(Date.now() - aiExtPageLoadStart);
        console.log(`aiExtPageLoad duration: ${Date.now() - aiExtPageLoadStart}ms`);
        
        // AI 외부 데이터 관리 - 법령 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(2000);
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
        await wait(2000);
        aiExtSearch.add(Date.now() - aiExtSearchStart);
        console.log(`aiExtSearch duration: ${Date.now() - aiExtSearchStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_search.png` });
        await page.goto(URLS.AI_DATA.LAW);

        // AI 외부 데이터 관리 - 법령 테이블 클릭
        const aiExtTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.TABLE_LIST);
        await page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
        await wait(2000);
        aiExtTableClick.add(Date.now() - aiExtTableClickStart);
        console.log(`aiExtTableClick duration: ${Date.now() - aiExtTableClickStart}ms`);
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
        await wait(2000);
        aiExtDataView.add(Date.now() - aiExtDataViewStart);
        console.log(`aiExtDataView duration: ${Date.now() - aiExtDataViewStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_table_detail.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);
        await wait(2000);

        // AI 외부 데이터 관리 - 법령 체크 박스
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_checkbox.png` });
        await page.goto(URLS.AI_DATA.LAW);

        // AI 외부 데이터 관리 - 법령 선택 문서 삭제
        const aiExtDeleteStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
        await wait(2000);
        aiExtDelete.add(Date.now() - aiExtDeleteStart);
        console.log(`aiExtDelete duration: ${Date.now() - aiExtDeleteStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_delete.png` });

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
        const payload = buildK6SummaryMessage(data, 'AI External Data');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/ai_external_data_${timestamp}.html`]: htmlReport(data),
    };
}