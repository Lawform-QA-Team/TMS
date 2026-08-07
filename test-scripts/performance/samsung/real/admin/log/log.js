import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { selectDateRangeInRdpCalendar } from '../../../../common/datepicker_helper.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const adminLogPageLoad = new Trend('admin_log_page_load', true);
export const adminLogDateSelect = new Trend('admin_log_date_select', true);
export const adminLogSearch = new Trend('admin_log_search', true);
export const adminLogAiChat = new Trend('admin_log_ai_chat', true);

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
        acceptDownloads: true,
        behavior: 'allow',
        downloadsPath: './downloads',
        viewport: { width: 1960, height: 1080 },
    });
    const page = await context.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);

        // 로그
        const adminLogPageLoadStart = Date.now();
        await page.goto(URLS.LOG.LOG);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_LOG.png` });
        const adminLogPageLoadDuration = Date.now() - adminLogPageLoadStart;
        adminLogPageLoad.add(adminLogPageLoadDuration);
        console.log(`Admin log page load duration: ${adminLogPageLoadDuration}ms`);

        // 로그, 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_LOG_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 로그, 일시 설정
        const adminLogDateSelectStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.BUTTON);
        const buttons = await page.$$(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.BUTTON);
        await buttons[Math.floor(Math.random() * buttons.length)].click();
        const adminLogDateSelectDuration = Date.now() - adminLogDateSelectStart;
        adminLogDateSelect.add(adminLogDateSelectDuration);
        console.log(`Admin log date select duration: ${adminLogDateSelectDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_LOG_date.png` });

        // 로그, 검색
        const adminLogSearchStart = Date.now();
        await page.waitForSelector('button[data-slot="popover-trigger"]');
        const datepickers = await page.$$('button[data-slot="popover-trigger"]');
        await selectDateRangeInRdpCalendar(page, datepickers[0], datepickers[1], '2026-02-01', '2026-02-28')
        await selectComboboxOption(page, SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_EVENT)
        await selectComboboxOption(page, SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_STATUS)
        await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.INPUT_SEARCH, 'a');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const adminLogSearchDuration = Date.now() - adminLogSearchStart;
        adminLogSearch.add(adminLogSearchDuration);
        console.log(`Admin log search duration: ${adminLogSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_LOG_search.png` });
        await page.goto(URLS.LOG.LOG);

        // 로그, 검색 -> AI 채팅
        const adminLogAiChatStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_EVENT);
        await page.locator(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_EVENT).click();
        const aiChatOption = page.locator('[role="option"]').filter({ hasText: 'AI 채팅' });
        await aiChatOption.click();
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.TABLE_LIST);
        await page.click(`${SELECTORS.COMMON.TABLE} span.cursor-pointer`);
        const adminLogAiChatDuration = Date.now() - adminLogAiChatStart;
        adminLogAiChat.add(adminLogAiChatDuration);
        console.log(`Admin log AI chat duration: ${adminLogAiChatDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_LOG_ai.png` });

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
        const payload = buildK6SummaryMessage(data, 'User Activity Log', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/user_activity_log_${timestamp}.html`]: htmlReport(data),
    };
}