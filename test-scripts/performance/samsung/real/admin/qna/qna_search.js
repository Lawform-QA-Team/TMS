import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { browser } from 'k6/browser';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { SELECTORS } from '../../selector_sam.js';
import { URLS } from '../../url_base_sam.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
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
        await wait(3000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_login_success.png` });
        
        // 1:1 문의 관리
        await page.goto(URLS.SERVICE.QNA);
        await page.waitForLoadState('load');
        await wait(5000);
        console.log('QNA URL:', await page.url());
        await page.screenshot({ path: `screenshots/${timestamp}_qna.png` });

        // 1:1 문의 관리, 페이지네이션
        await page.waitForSelector(SELECTORS.COMMON.PAGE_LAST);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        await page.screenshot({ path: `screenshots/${timestamp}_qna_page_last.png` });
        await page.waitForSelector(SELECTORS.COMMON.PAGE_FIRST);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);
        await wait(5000);
        await page.screenshot({ path: `screenshots/${timestamp}_qna_page_first.png` });

        // 1:1 문의 관리, 상태 필터
        await selectComboboxOption(page, SELECTORS.ADMIN.QNA.SELECT_ANSWER_STATUS);
        await page.waitForSelector(SELECTORS.ADMIN.QNA.INPUT_SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_qna_status.png` });

        // 1:1 문의 관리, 검색
        await page.type(SELECTORS.ADMIN.QNA.INPUT_SEARCH, '문의');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_qna_search.png` });
        await page.goto(URLS.SERVICE.QNA);

        // 1:1 문의 관리, 테이블 클릭
        await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        await page.screenshot({ path: `screenshots/${timestamp}_qna_table.png` });
        await page.waitForSelector(SELECTORS.ADMIN.QNA.BUTTON_LIST);
        await page.click(SELECTORS.ADMIN.QNA.BUTTON_LIST);

        // 1:1 문의 관리, 답변 작성
        await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await page.waitForSelector(`[contenteditable="true"]`);
        await page.type(`[contenteditable="true"]`, '문의 테스트 1');
        await page.keyboard.press('Enter')
        await page.type(`[contenteditable="true"]`, '문의 테스트 2');
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_qna_answer_write.png` });
        
        // 1:1 문의 관리, 답변 저장
        await page.waitForSelector(SELECTORS.ADMIN.QNA.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.QNA.BUTTON_SAVE);
        await page.goto(URLS.SERVICE.QNA);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_qna_answer_submit.png` });

        
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
        const payload = buildK6SummaryMessage(data, 'QNA Search');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/qna_search_${timestamp}.html`]: htmlReport(data),
    };
}