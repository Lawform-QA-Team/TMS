import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { sendSlackWebhook, buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const docUpdateOthPageLoad = new Trend('admin_doc_update_oth_page_load', true);
export const docUpdateOthDateSelect = new Trend('admin_doc_update_oth_date_select', true);
export const docUpdateOthCompanySelect = new Trend('admin_doc_update_oth_company_select', true);
export const docUpdateOthViewOriginal = new Trend('admin_doc_update_oth_view_original', true);

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

        // 문서 업데이트 리포트 - 타사문서
        const docUpdateOthPageLoadStart = Date.now();
        await page.goto(URLS.DOCUMENT_UPDATE.OTHER);
        await wait(2000);
        const docUpdateOthPageLoadDuration = Date.now() - docUpdateOthPageLoadStart;
        docUpdateOthPageLoad.add(docUpdateOthPageLoadDuration);
        console.log(`docUpdateOthPageLoad duration: ${docUpdateOthPageLoadDuration}ms`);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW.png` });

        // 문서 업데이트 리포트 - 타사문서, 날짜 선택
        const docUpdateOthDateSelectStart = Date.now();
        await selectComboboxOption(page, SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.DATEPICKER)
        await wait(2000);
        const docUpdateOthDateSelectDuration = Date.now() - docUpdateOthDateSelectStart;
        docUpdateOthDateSelect.add(docUpdateOthDateSelectDuration);
        console.log(`docUpdateOthDateSelect duration: ${docUpdateOthDateSelectDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_date.png` });

        // 문서 업데이트 리포트 - 타사문서, 전체 업데이트 이력
        // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
        // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_update.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);
        // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CLOSE);

        // 문서 업데이트 리포트 - 타사문서, 전체 업데이트 이력, 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
        // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_HISTORY_CLICK);
        // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.PAGINATION);
        // const last_pages = await page.$$(SELECTORS.COMMON.PAGE_LAST);
        // await last_pages[0].click();
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_LAW_pagination.png` });
        // const first_pages = await page.$$(SELECTORS.COMMON.PAGE_FIRST);
        // await first_pages[0].click();
        
        // 문서 업데이트 리포트 - 타사문서, 전체 업데이트 이력, 항목 선택
        // await page.waitForLoadState("load");
        // const checks = await page.$$(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.CHECKBOX_1);
        // await checks[1].click();
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_select_history.png` });

        // 문서 업데이트 리포트 - 타사문서, 전체 업데이트 이력, 확인
        // await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CONFIRM);
        // await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_CONFIRM);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_confirm.png` });

        // 문서 업데이트 리포트 - 타사문서, 기업 선택
        const docUpdateOthCompanySelectStart = Date.now();
        await page.waitForLoadState('load');
        const companies = await page.$$('button[data-appearance="outline"][data-size="md"]');
        await companies[Math.floor(Math.random() * companies.length)].click();
        await wait(2000);
        const docUpdateOthCompanySelectDuration = Date.now() - docUpdateOthCompanySelectStart;
        docUpdateOthCompanySelect.add(docUpdateOthCompanySelectDuration);
        console.log(`docUpdateOthCompanySelect duration: ${docUpdateOthCompanySelectDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_select_history.png` });

        // 문서 업데이트 리포트 - 타사문서, 원문보기
        const docUpdateOthViewOriginalStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_VIEW_ORIGINAL);
        await page.click(SELECTORS.ADMIN.DOCUMENT_UPDATE_REPORT.BUTTON_VIEW_ORIGINAL);
        await wait(2000);
        const docUpdateOthViewOriginalDuration = Date.now() - docUpdateOthViewOriginalStart;
        docUpdateOthViewOriginal.add(docUpdateOthViewOriginalDuration);
        console.log(`docUpdateOthViewOriginal duration: ${docUpdateOthViewOriginalDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DOCUMENT_UPDATE_OTHER_original.png` });

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
        const payload = buildK6SummaryMessage(data, 'Document Update Report Other');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/document_update_report_other_${timestamp}.html`]: htmlReport(data),
    };
}