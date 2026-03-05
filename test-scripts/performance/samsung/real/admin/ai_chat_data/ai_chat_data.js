import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { sendSlackWebhook, buildK6SummaryMessage } from '../../../../common/slack_helper.js';

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

        // AI 채팅 데이터 관리 - 채팅 로그 데이터
        await page.goto(URLS.AI_CHAT.CHATLOG);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data.png` });
        await wait(5000);

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 페이지네이션
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_pagination_last.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);
        
        // AI 채팅 데이터 관리 - 채팅 로그 데이터 검색
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AI_CHAT_LOG.INPUT_SEARCH, '1');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_search.png` });
        await page.goto(URLS.AI_CHAT.CHATLOG);

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 테이블 클릭
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.TABLE_LIST);
        await page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_table.png` });
        
        // AI 채팅 데이터 관리 - 채팅 로그 데이터 채팅 데이터 등록 진입
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_submit.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_CLOSE);

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 채팅 데이터 등록 작성
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_REGISTER);
        await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_AI_DRAFT);
        await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_AI_DRAFT);
        await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT);
        await page.type(SELECTORS.ADMIN.AI_PRESET_CHAT.INPUT, '질문 테스트');
        await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA);
        await page.type(SELECTORS.ADMIN.AI_PRESET_CHAT.TEXTAREA, '답변 테스트');
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_submit_write.png` });
        
        // AI 채팅 데이터 관리 - 채팅 로그 데이터 채팅 데이터 등록 저장
        await page.waitForSelector(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.AI_PRESET_CHAT.BUTTON_SAVE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_data_submit_save.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_LIST);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_LIST);

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 체크 박스
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX);
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_checkbox.png` });
        await page.goto(URLS.AI_CHAT.CHATLOG);

        // AI 채팅 데이터 관리 - 채팅 로그 데이터 문서 삭제
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.CHECKBOX_1);
        await page.waitForSelector(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_DELETE);
        await page.click(SELECTORS.ADMIN.AI_CHAT_LOG.BUTTON_DELETE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_CHAT_LOG_delete.png` });

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
        const payload = buildK6SummaryMessage(data, 'AI Chat Data');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/ai_chat_data_${timestamp}.html`]: htmlReport(data),
    };
}