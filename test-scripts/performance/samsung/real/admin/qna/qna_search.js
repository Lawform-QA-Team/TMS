import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { browser } from 'k6/browser';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { SELECTORS } from '../../selector_sam.js';
import { URLS } from '../../url_base_sam.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const adminQnaPageLoad = new Trend('admin_qna_page_load', true);
export const adminQnaStatusFilter = new Trend('admin_qna_status_filter', true);
export const adminQnaSearch = new Trend('admin_qna_search', true);
export const adminQnaTableClick = new Trend('admin_qna_table_click', true);
export const adminQnaAnswerSave = new Trend('admin_qna_answer_save', true);

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
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_login_success.png` });
        
        // 1:1 문의 관리
        const adminQnaPageLoadStart = Date.now();
        await page.goto(URLS.SERVICE.QNA);
        await page.waitForLoadState('load');
        console.log('QNA URL:', await page.url());
        await page.screenshot({ path: `screenshots/${timestamp}_qna.png` });
        const adminQnaPageLoadDuration = Date.now() - adminQnaPageLoadStart;
        adminQnaPageLoad.add(adminQnaPageLoadDuration);
        console.log(`Admin QNA page load duration: ${adminQnaPageLoadDuration}ms`);

        // 1:1 문의 관리, 페이지네이션
        // await page.waitForSelector(SELECTORS.COMMON.PAGE_LAST);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await page.screenshot({ path: `screenshots/${timestamp}_qna_page_last.png` });
        // await page.waitForSelector(SELECTORS.COMMON.PAGE_FIRST);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);
        // await page.screenshot({ path: `screenshots/${timestamp}_qna_page_first.png` });

        // 1:1 문의 관리, 상태 필터
        const adminQnaStatusFilterStart = Date.now();
        await selectComboboxOption(page, SELECTORS.ADMIN.QNA.SELECT_ANSWER_STATUS);
        await page.waitForSelector(SELECTORS.ADMIN.QNA.INPUT_SEARCH);
        const adminQnaStatusFilterDuration = Date.now() - adminQnaStatusFilterStart;
        adminQnaStatusFilter.add(adminQnaStatusFilterDuration);
        console.log(`Admin QNA status filter duration: ${adminQnaStatusFilterDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_qna_status.png` });

        // 1:1 문의 관리, 검색
        const adminQnaSearchStart = Date.now();
        await page.type(SELECTORS.ADMIN.QNA.INPUT_SEARCH, '문의');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const adminQnaSearchDuration = Date.now() - adminQnaSearchStart;
        adminQnaSearch.add(adminQnaSearchDuration);
        console.log(`Admin QNA search duration: ${adminQnaSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_qna_search.png` });
        await page.goto(URLS.SERVICE.QNA);

        // 1:1 문의 관리, 테이블 클릭
        await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
        const adminQnaTableClickStart = Date.now();
        await page.click(SELECTORS.COMMON.TABLE);
        const adminQnaTableClickDuration = Date.now() - adminQnaTableClickStart;
        adminQnaTableClick.add(adminQnaTableClickDuration);
        console.log(`Admin QNA table click duration: ${adminQnaTableClickDuration}ms`);
        await page.screenshot({ path: `screenshots/${timestamp}_qna_table.png` });
        await page.waitForSelector(SELECTORS.ADMIN.QNA.BUTTON_LIST);
        await page.click(SELECTORS.ADMIN.QNA.BUTTON_LIST);

        // 1:1 문의 관리, 답변 작성
        const adminQnaAnswerSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.QNA.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await page.waitForSelector(`[contenteditable="true"]`);
        await page.type(`[contenteditable="true"]`, '문의 테스트 1');
        await page.keyboard.press('Enter')
        await page.type(`[contenteditable="true"]`, '문의 테스트 2');
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_qna_answer_write.png` });
        
        // 1:1 문의 관리, 답변 저장
        await page.waitForSelector(SELECTORS.ADMIN.QNA.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.QNA.BUTTON_SAVE);
        await page.goto(URLS.SERVICE.QNA);
        const adminQnaAnswerSaveDuration = Date.now() - adminQnaAnswerSaveStart;
        adminQnaAnswerSave.add(adminQnaAnswerSaveDuration);
        console.log(`Admin QNA answer save duration: ${adminQnaAnswerSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_qna_answer_submit.png` });


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
        [`Result/qna_search_${timestamp}.html`]: htmlReport(data),
    };
    if (metricsFile) {
        output[metricsFile] = JSON.stringify({
            payload: buildK6SummaryMessage(data, 'QNA Search', scriptErrors.length > 0),
            scriptErrors,
        });
    }
    return output;
}