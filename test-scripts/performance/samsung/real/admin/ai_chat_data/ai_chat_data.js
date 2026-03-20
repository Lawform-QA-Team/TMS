import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const aiChatPageLoad = new Trend('admin_ai_chat_page_load', true);
export const aiChatSearch = new Trend('admin_ai_chat_search', true);
export const aiChatTableClick = new Trend('admin_ai_chat_table_click', true);
export const aiChatRegisterSave = new Trend('admin_ai_chat_register_save', true);
export const aiChatDelete = new Trend('admin_ai_chat_delete', true);

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

        // AI 채팅 데이터 관리 - 채팅 로그 데이터
        const aiChatPageLoadStart = Date.now();
        await page.goto(URLS.AI_CHAT.CHATLOG);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data.png` });
        const aiChatPageLoadDuration = Date.now() - aiChatPageLoadStart;
        aiChatPageLoad.add(aiChatPageLoadDuration);
        console.log(`aiChatPageLoad duration: ${aiChatPageLoadDuration}ms`);

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);
        
        // AI 채팅 데이터 관리 - 채팅 로그 데이터 검색
        const aiChatSearchStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AI_CHAT_LOG.INPUT_SEARCH, '테스트');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const aiChatSearchDuration = Date.now() - aiChatSearchStart;
        aiChatSearch.add(aiChatSearchDuration);
        console.log(`aiChatSearch duration: ${aiChatSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_search.png` });
        await page.goto(URLS.AI_CHAT.CHATLOG);

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 테이블 클릭
        const aiChatTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.TABLE_LIST);
        await page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
        const aiChatTableClickDuration = Date.now() - aiChatTableClickStart;
        aiChatTableClick.add(aiChatTableClickDuration);
        console.log(`aiChatTableClick duration: ${aiChatTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_table.png` });
        
        // AI 채팅 데이터 관리 - 채팅 로그 데이터 채팅 데이터 등록 진입
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_submit.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_CLOSE);

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 채팅 데이터 등록 작성
        const aiChatRegisterSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
        await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT);
        await page.type(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT, '질문 테스트');
        await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_AI_DRAFT);
        await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_AI_DRAFT);
        await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA);
        await page.waitForFunction(
            (selector) => {
                const el = document.querySelector(selector);
                return el && !el.disabled;
            },
            {},
            SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA
        );
        await page.type(SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA, '답변 테스트');
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_submit_write.png` });

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 채팅 데이터 등록 저장
        await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_SAVE);
        const aiChatRegisterSaveDuration = Date.now() - aiChatRegisterSaveStart;
        aiChatRegisterSave.add(aiChatRegisterSaveDuration);
        console.log(`aiChatRegisterSave duration: ${aiChatRegisterSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_submit_save.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_LIST);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_LIST);

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 체크 박스
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_checkbox.png` });
        await page.goto(URLS.AI_CHAT.CHATLOG);

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 문서 삭제
        const aiChatDeleteStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_DELETE);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_DELETE);
        const aiChatDeleteDuration = Date.now() - aiChatDeleteStart;
        aiChatDelete.add(aiChatDeleteDuration);
        console.log(`aiChatDelete duration: ${aiChatDeleteDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_delete.png` });

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
        const payload = buildK6SummaryMessage(data, 'AI Chat Data', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/ai_chat_data_${timestamp}.html`]: htmlReport(data),
    };
}