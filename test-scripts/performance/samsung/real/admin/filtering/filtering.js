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

        // 필터링 관리
        await page.goto(URLS.FILTERING.FILTERING);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING.png` });
        await wait(5000);

        // 필터링 관리 페이지네이션
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_pagination_last.png` });
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 필터링 관리 검색
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.FILTERING.INPUT_SEARCH, '필터');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_search.png` });

        // 필터링 관리 필터링 등록 진입
        await page.goto(URLS.FILTERING.FILTERING);
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
        await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register.png` });
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_CLOSE);

        // 필터링 관리 필터링 등록 작성
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
        await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT);
        await page.type(SELECTORS.ADMIN.FILTERING.INPUT, '필터링 단어 테스트');
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_1);
        await page.type(SELECTORS.ADMIN.FILTERING.INPUT_1, '필터링 사유 테스트');
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_write.png` });
        
        // 필터링 관리 필터링 등록
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
        await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_submit.png` });

        // 필터링 관리 테이블 클릭
        await page.waitForSelector(SELECTORS.COMMON.TABLE);
        await page.click(`${SELECTORS.COMMON.TABLE} button`);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_table.png` });

        // 필터링 관리 수정
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT);
        await page.type(SELECTORS.ADMIN.FILTERING.INPUT, '필터링 단어 테스트 2');
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_1);
        await page.type(SELECTORS.ADMIN.FILTERING.INPUT_1, '필터링 사유 테스트 2');
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.SWITCH);
        await page.click(SELECTORS.ADMIN.FILTERING.SWITCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_edit.png` });
        
        // 필터링 관리 수정 저장
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
        await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_edit_submit.png` });

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
        const payload = buildK6SummaryMessage(data, 'Filtering');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/filtering_${timestamp}.html`]: htmlReport(data),
    };
}