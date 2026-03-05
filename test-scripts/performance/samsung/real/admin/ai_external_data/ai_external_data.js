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

        // AI 외부 데이터 관리 진입 - 법령
        await page.goto(URLS.AI_DATA.LAW);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA.png` });
        await wait(5000);
        
        // AI 외부 데이터 관리 - 법령 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(5000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // AI 외부 데이터 관리 - 법령 검색
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH, '법령');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_search.png` });

        // AI 외부 데이터 관리 - 법령 테이블 클릭
        // await page.goto(URLS.AI_DATA.LAW);
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.TABLE_LIST);
        // await page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
        // await wait(5000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_table.png` });

        // AI 외부 데이터 관리 - 법령 체크 박스
        // await page.goto(URLS.AI_DATA.COMPANY);
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        // await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        // await wait(5000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_checkbox.png` });

        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        // await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);

        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        // await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        // await wait(5000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_checkbox_1.png` });

        // AI 외부 데이터 관리 - 법령 선택 문서 삭제
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
        // await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
        // await wait(5000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_delete.png` });

        // AI 외부 데이터 관리 - 타사 문서 진입
        await page.goto(URLS.AI_DATA.COMPANY);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company.png` });
        await wait(5000);

        // AI 외부 데이터 관리 - 타사 문서 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(5000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // AI 외부 데이터 관리 - 타사 문서 검색
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH, '타사');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_search.png` });

        // AI 외부 데이터 관리 - 타사 문서 등록 진입
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_GO_BACK);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_GO_BACK);

        // AI 외부 데이터 관리 - 타사 문서 등록
        await page.goto(URLS.AI_DATA.COMPANY);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_CATEGORY);
        await page.type(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_CATEGORY, '타사 문서 등록 테스트');
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_URL);
        await page.type(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_URL, 'https://www.google.com');
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_EXTRACT_TEXT);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_EXTRACT_TEXT);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_CLOSE);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_PREVIEW);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_PREVIEW);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_CLOSE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register_write.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_SUBMIT);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_SUBMIT);
        await page.goto(URLS.AI_DATA.COMPANY);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register_submit.png` });

        // AI 외부 데이터 관리 - 타사 문서 테이블 클릭
        await page.waitForSelector(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
        await page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_table_click.png` });

        // AI 외부 데이터 관리 - 타사 문서 테이블 상세
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_VIEW);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_VIEW);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_table_detail.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);

        // AI 외부 데이터 관리 - 타사 문서 체크 박스
        await page.goto(URLS.AI_DATA.COMPANY);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_checkbox.png` });

        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);

        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_checkbox_1.png` });

        // AI 외부 데이터 관리 - 타사 문서 선택 문서 삭제
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
        await wait(5000);
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