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
        await page.goto(URLS.AUTODOC.CATEGORY);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category.png` });
        await wait(5000);

        // 카테고리 관리 페이지네이션 -> 미구현
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(5000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 카테고리 검색
        // await page.goto(URLS.AUTODOC.CATEGORY);
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH, '카테고리');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_search.png` });
        await page.goto(URLS.AUTODOC.CATEGORY);

        // 카테고리 등록 진입
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);

        // 카테고리 등록 작성
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT);
        await page.type(SELECTORS.ADMIN.AUTODOC.INPUT, '카테고리 등록 테스트');
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register_write.png` });

        // 카테고리 등록 저장
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register_save.png` });

        // 카테고리 테이블 클릭
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_table.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);

        // 카테고리 수정
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT);
        await page.type(SELECTORS.ADMIN.AUTODOC.INPUT, '카테고리 수정');
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_edit_category.png` });

        // 카테고리 수정 저장
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_edit_category_save.png` });

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