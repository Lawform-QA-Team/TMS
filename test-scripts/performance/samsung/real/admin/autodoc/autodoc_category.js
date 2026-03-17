import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { sendSlackWebhook, buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const adminAutodocCatPageLoad = new Trend('admin_autodoc_cat_page_load', true);
export const adminAutodocCatSearch = new Trend('admin_autodoc_cat_search', true);
export const adminAutodocCatRegisterSave = new Trend('admin_autodoc_cat_register_save', true);
export const adminAutodocCatTableClick = new Trend('admin_autodoc_cat_table_click', true);
export const adminAutodocCatEditSave = new Trend('admin_autodoc_cat_edit_save', true);

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
    const randomStr = () => Math.random().toString(36).slice(2, 7);

    try {
        await loginWithPage(page, credentials);

        // 표준 양식 관리 진입
        const adminAutodocCatPageLoadStart = Date.now();
        await page.goto(URLS.AUTODOC.CATEGORY);
        await wait(2000);
        adminAutodocCatPageLoad.add(Date.now() - adminAutodocCatPageLoadStart);
        console.log(`adminAutodocCatPageLoad duration: ${Date.now() - adminAutodocCatPageLoadStart}ms`);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category.png` });

        // 카테고리 관리 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 카테고리 검색
        const adminAutodocCatSearchStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH, '카테고리');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(2000);
        adminAutodocCatSearch.add(Date.now() - adminAutodocCatSearchStart);
        console.log(`adminAutodocCatSearch duration: ${Date.now() - adminAutodocCatSearchStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_search.png` });
        await page.goto(URLS.AUTODOC.CATEGORY);

        // 카테고리 등록 진입
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);

        // 카테고리 등록 작성
        const adminAutodocCatRegisterSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT);
        await page.fill(SELECTORS.ADMIN.AUTODOC.INPUT, `cat_${randomStr()}`);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register_write.png` });

        // 카테고리 등록 저장
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
        await wait(2000);
        adminAutodocCatRegisterSave.add(Date.now() - adminAutodocCatRegisterSaveStart);
        console.log(`adminAutodocCatRegisterSave duration: ${Date.now() - adminAutodocCatRegisterSaveStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register_save.png` });

        // 카테고리 테이블 클릭
        const adminAutodocCatTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(2000);
        adminAutodocCatTableClick.add(Date.now() - adminAutodocCatTableClickStart);
        console.log(`adminAutodocCatTableClick duration: ${Date.now() - adminAutodocCatTableClickStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_table.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);

        // 카테고리 수정
        const adminAutodocCatEditSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT);
        await page.fill(SELECTORS.ADMIN.AUTODOC.INPUT, `edit_${randomStr()}`);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_edit_category.png` });

        // 카테고리 수정 저장
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
        await wait(2000);
        adminAutodocCatEditSave.add(Date.now() - adminAutodocCatEditSaveStart);
        console.log(`adminAutodocCatEditSave duration: ${Date.now() - adminAutodocCatEditSaveStart}ms`);
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
        const payload = buildK6SummaryMessage(data, 'Autodoc Category');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/autodoc_category_${timestamp}.html`]: htmlReport(data),
    };
}