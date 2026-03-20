import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const webNoticePageLoad = new Trend('web_notice_page_load', true);
export const webNoticeSearch = new Trend('web_notice_search', true);
export const webNoticeTableClick = new Trend('web_notice_table_click', true);
export const webNoticeHistory = new Trend('web_notice_history', true);

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
        viewport: { width: 1960, height: 1080 },
    });
    const page = await context.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);

        // 공지사항
        const webNoticePageLoadStart = Date.now();
        await page.goto(URLS.SERVICE.WEB_NOTICE);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE.png` });
        const webNoticePageLoadDuration = Date.now() - webNoticePageLoadStart;
        webNoticePageLoad.add(webNoticePageLoadDuration);
        console.log(`web_notice_page_load: ${webNoticePageLoadDuration}ms`);

        // 공지사항, 페이지네이션
        // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 공지사항, 검색
        const webNoticeSearchStart = Date.now();
        await page.waitForSelector(SELECTORS.WEB.NOTICE.INPUT_SEARCH);
        await page.type(SELECTORS.WEB.NOTICE.INPUT_SEARCH, '공지');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const webNoticeSearchDuration = Date.now() - webNoticeSearchStart;
        webNoticeSearch.add(webNoticeSearchDuration);
        console.log(`web_notice_search: ${webNoticeSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_search.png` });

        // 공지사항, 테이블 클릭
        const webNoticeTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        const webNoticeTableClickDuration = Date.now() - webNoticeTableClickStart;
        webNoticeTableClick.add(webNoticeTableClickDuration);
        console.log(`web_notice_table_click: ${webNoticeTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_table.png` });

        // 공지사항, 수정 이력
        const webNoticeHistoryStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
        const webNoticeHistoryDuration = Date.now() - webNoticeHistoryStart;
        webNoticeHistory.add(webNoticeHistoryDuration);
        console.log(`web_notice_history: ${webNoticeHistoryDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history.png` });

        // 공지사항, 수정 이력 페이지네이션
        // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history_pagination_last.png` });
        
        // 공지사항, 수정 이력 닫기
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history_close.png` });

        // 공지사항, 목록
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_list.png` });

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
    const metricsFile = __ENV._K6_METRICS_FILE;
    const output = {
        [`Result/web_notice_${timestamp}.html`]: htmlReport(data),
    };
    if (metricsFile) {
        output[metricsFile] = JSON.stringify({
            payload: buildK6SummaryMessage(data, 'Web Notice', scriptErrors.length > 0),
            scriptErrors,
        });
    }
    return output;
}