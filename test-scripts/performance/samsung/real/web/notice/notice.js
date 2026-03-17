import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { sendSlackWebhook, buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const webNoticePageLoad = new Trend('web_notice_page_load', true);
export const webNoticeSearch = new Trend('web_notice_search', true);
export const webNoticeTableClick = new Trend('web_notice_table_click', true);
export const webNoticeHistory = new Trend('web_notice_history', true);

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

        // 공지사항
        const webNoticePageLoadStart = Date.now();
        await page.goto(URLS.SERVICE.WEB_NOTICE);
        await wait(2000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE.png` });
        webNoticePageLoad.add(Date.now() - webNoticePageLoadStart);
        console.log(`web_notice_page_load: ${Date.now() - webNoticePageLoadStart}ms`);

        // 공지사항, 페이지네이션
        // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(2000);
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
        await wait(2000);
        webNoticeSearch.add(Date.now() - webNoticeSearchStart);
        console.log(`web_notice_search: ${Date.now() - webNoticeSearchStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_search.png` });

        // 공지사항, 테이블 클릭
        const webNoticeTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(2000);
        webNoticeTableClick.add(Date.now() - webNoticeTableClickStart);
        console.log(`web_notice_table_click: ${Date.now() - webNoticeTableClickStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_table.png` });

        // 공지사항, 수정 이력
        const webNoticeHistoryStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
        await wait(2000);
        webNoticeHistory.add(Date.now() - webNoticeHistoryStart);
        console.log(`web_notice_history: ${Date.now() - webNoticeHistoryStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history.png` });

        // 공지사항, 수정 이력 페이지네이션
        // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history_pagination_last.png` });
        
        // 공지사항, 수정 이력 닫기
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history_close.png` });

        // 공지사항, 목록
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_list.png` });

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
        const payload = buildK6SummaryMessage(data, 'Web Notice');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/web_notice_${timestamp}.html`]: htmlReport(data),
    };
}