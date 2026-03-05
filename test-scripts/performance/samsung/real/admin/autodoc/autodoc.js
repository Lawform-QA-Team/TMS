import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
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

        // 표준 양식 관리 진입
        await page.goto(URLS.AUTODOC.AUTODOC);
        await wait(5000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC.png` });

        // 표준 양식 테이블 페이지네이션
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST); // 마지막 페이지 이동
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST); // 첫 페이지 이동

        // 표준 양식 검색
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH, '표준 양식');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_search.png` });
        await page.goto(URLS.AUTODOC.AUTODOC);

        // 표준 양식 등록 진입
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_register.png` });

        // 표준 양식 등록 - 양식 유형 선택
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.SELECT_SELECTED_CATEGORY);
        await selectComboboxOption(page, SELECTORS.ADMIN.AUTODOC.SELECT_SELECTED_CATEGORY);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_register.select.png` });
        await page.goto(URLS.AUTODOC.AUTODOC);

        // 표준 양식 테이블 클릭
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_table.png` });
        await page.goto(URLS.AUTODOC.AUTODOC);

        // 업데이트 추천 -> 미구현
        // await page.goto(URLS.AUTODOC.AUTODOC);
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_UPDATE_RECOMMEND);
        // await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_UPDATE_RECOMMEND);
        // await wait(5000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_update.png` });

        // 카테고리 관리
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CATEGORY_MANAGEMENT);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CATEGORY_MANAGEMENT);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category.png` });

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
        const payload = buildK6SummaryMessage(data, 'Autodoc');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/autodoc_${timestamp}.html`]: htmlReport(data),
    };
}