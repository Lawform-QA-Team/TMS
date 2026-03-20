import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const webQnaPageLoad = new Trend('web_qna_page_load', true);
export const webQnaStatusFilter = new Trend('web_qna_status_filter', true);
export const webQnaSearch = new Trend('web_qna_search', true);
export const webQnaRegisterSave = new Trend('web_qna_register_save', true);
export const webQnaTableClick = new Trend('web_qna_table_click', true);

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

        // 1:1 문의
        const webQnaPageLoadStart = Date.now();
        await page.goto(URLS.SERVICE.WEB_QNA);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_QNA.png` });
        const webQnaPageLoadDuration = Date.now() - webQnaPageLoadStart;
        webQnaPageLoad.add(webQnaPageLoadDuration);
        console.log(`web_qna_page_load: ${webQnaPageLoadDuration}ms`);

        // 1:1 문의, 페이지네이션
        // await page.waitForSelector(SELECTORS.FEATURES.QNA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_QNA_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.FEATURES.QNA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 1:1 문의, 상태 필터
        const webQnaStatusFilterStart = Date.now();
        await selectComboboxOption(page, SELECTORS.WEB.QNA.SELECT_STATUS);
        await page.waitForSelector(SELECTORS.WEB.QNA.INPUT_SEARCH);
        const webQnaStatusFilterDuration = Date.now() - webQnaStatusFilterStart;
        webQnaStatusFilter.add(webQnaStatusFilterDuration);
        console.log(`web_qna_status_filter: ${webQnaStatusFilterDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_QNA_status.png` });

        // 1:1 문의, 검색
        const webQnaSearchStart = Date.now();
        await page.type(SELECTORS.WEB.QNA.INPUT_SEARCH, '문의');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const webQnaSearchDuration = Date.now() - webQnaSearchStart;
        webQnaSearch.add(webQnaSearchDuration);
        console.log(`web_qna_search: ${webQnaSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_QNA_search.png` });
        await page.goto(URLS.SERVICE.WEB_QNA);

        // 1:1 문의, 문의 등록 진입
        await page.waitForSelector(SELECTORS.WEB.QNA.BUTTON_CREATE_QNA);
        await page.click(SELECTORS.WEB.QNA.BUTTON_CREATE_QNA);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_QNA_create.png` });
        await page.waitForSelector(SELECTORS.WEB.QNA.BUTTON_CANCEL);
        await page.click(SELECTORS.WEB.QNA.BUTTON_CANCEL);

        // 1:1 문의, 문의 등록 작성
        const webQnaRegisterSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.WEB.QNA.BUTTON_CREATE_QNA);
        await page.click(SELECTORS.WEB.QNA.BUTTON_CREATE_QNA);
        await page.waitForSelector(SELECTORS.WEB.QNA.INPUT);
        await page.type(SELECTORS.WEB.QNA.INPUT, '문의 테스트');
        await page.waitForSelector(`[contenteditable="true"]`);
        await page.locator(`[contenteditable="true"]`).first().fill('문의 테스트 1');
        await page.keyboard.press('Enter');
        await page.locator(`[contenteditable="true"]`).first().type('문의 테스트 2');
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_QNA_create_write.png` });

        // 1:1 문의, 문의 등록
        await page.waitForSelector(SELECTORS.WEB.QNA.BUTTON_CLICK_SUBMIT);
        await page.click(SELECTORS.WEB.QNA.BUTTON_CLICK_SUBMIT);
        const webQnaRegisterSaveDuration = Date.now() - webQnaRegisterSaveStart;
        webQnaRegisterSave.add(webQnaRegisterSaveDuration);
        console.log(`web_qna_register_save: ${webQnaRegisterSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_QNA_create_submit.png` });

        // 1:1 문의, 테이블 클릭
        const webQnaTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        const webQnaTableClickDuration = Date.now() - webQnaTableClickStart;
        webQnaTableClick.add(webQnaTableClickDuration);
        console.log(`web_qna_table_click: ${webQnaTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_QNA_table.png` });
        await page.waitForSelector(SELECTORS.WEB.QNA.BUTTON_CLICK_GO_TO_LIST);
        await page.click(SELECTORS.WEB.QNA.BUTTON_CLICK_GO_TO_LIST);

        // 1:1 문의, 취소
        await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await page.waitForSelector(SELECTORS.WEB.QNA.BUTTON_CLICK_CANCEL);
        await page.click(SELECTORS.WEB.QNA.BUTTON_CLICK_CANCEL);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_QNA_cancel.png` });

        // 모달 관련 내용 추가 필요

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
    const metricsFile = __ENV._K6_METRICS_FILE;
    const output = {
        [`Result/web_qna_${timestamp}.html`]: htmlReport(data),
    };
    if (metricsFile) {
        output[metricsFile] = JSON.stringify({
            payload: buildK6SummaryMessage(data, 'Web QnA', scriptErrors.length > 0),
            scriptErrors,
        });
    }
    return output;
}