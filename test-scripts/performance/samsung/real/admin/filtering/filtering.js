import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const adminFilteringPageLoad = new Trend('admin_filtering_page_load', true);
export const adminFilteringSearch = new Trend('admin_filtering_search', true);
export const adminFilteringRegisterSave = new Trend('admin_filtering_register_save', true);
export const adminFilteringTableClick = new Trend('admin_filtering_table_click', true);
export const adminFilteringEditSave = new Trend('admin_filtering_edit_save', true);

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

/**
 * 랜덤 문자열 생성 함수
 * @param {number} length - 생성할 문자열 길이
 * @returns {string} 랜덤 문자열
 */
function generateRandomString(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
        const adminFilteringPageLoadStart = Date.now();
        await page.goto(URLS.FILTERING.FILTERING);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING.png` });
        const adminFilteringPageLoadDuration = Date.now() - adminFilteringPageLoadStart;
        adminFilteringPageLoad.add(adminFilteringPageLoadDuration);
        console.log(`Admin filtering page load duration: ${adminFilteringPageLoadDuration}ms`);

        // 필터링 관리 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.FILTERING.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.FILTERING.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 필터링 관리 검색
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_SEARCH);
        const adminFilteringSearchStart = Date.now();
        await page.type(SELECTORS.ADMIN.FILTERING.INPUT_SEARCH, '필터');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const adminFilteringSearchDuration = Date.now() - adminFilteringSearchStart;
        adminFilteringSearch.add(adminFilteringSearchDuration);
        console.log(`Admin filtering search duration: ${adminFilteringSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_search.png` });

        // 필터링 관리 필터링 등록 진입
        await page.goto(URLS.FILTERING.FILTERING);
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
        await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register.png` });
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_CLOSE);

        // 필터링 관리 필터링 등록 작성
        const adminFilteringRegisterSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
        await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_REGISTER_CLICK);
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT);
        const randomWord = `필터_${generateRandomString(8)}_${Date.now()}`;
        await page.fill(SELECTORS.ADMIN.FILTERING.INPUT, randomWord);
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_1);
        const randomReason = `테스트사유_${generateRandomString(6)}_${getNewTimeStamp()}`;
        await page.fill(SELECTORS.ADMIN.FILTERING.INPUT_1, randomReason);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_write.png` });
        
        // 필터링 관리 필터링 등록
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
        await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
        const adminFilteringRegisterSaveDuration = Date.now() - adminFilteringRegisterSaveStart;
        adminFilteringRegisterSave.add(adminFilteringRegisterSaveDuration);
        console.log(`Admin filtering register save duration: ${adminFilteringRegisterSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_submit.png` });

        // 필터링 관리 테이블 클릭
        await page.waitForSelector(SELECTORS.COMMON.TABLE);
        const adminFilteringTableClickStart = Date.now();
        await page.click(`${SELECTORS.COMMON.TABLE} button`);
        const adminFilteringTableClickDuration = Date.now() - adminFilteringTableClickStart;
        adminFilteringTableClick.add(adminFilteringTableClickDuration);
        console.log(`Admin filtering table click duration: ${adminFilteringTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_table.png` });

        // 필터링 관리 수정
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT);
        const editRandomWord = `수정필터_${generateRandomString(8)}_${Date.now()}`;
        const adminFilteringEditSaveStart = Date.now();
        await page.fill(SELECTORS.ADMIN.FILTERING.INPUT, editRandomWord);
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.INPUT_1);
        const editRandomReason = `수정사유_${generateRandomString(6)}_${getNewTimeStamp()}`;
        await page.fill(SELECTORS.ADMIN.FILTERING.INPUT_1, editRandomReason);
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.SWITCH);
        await page.click(SELECTORS.ADMIN.FILTERING.SWITCH);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_edit.png` });
        
        // 필터링 관리 수정 저장
        await page.waitForSelector(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
        await page.click(SELECTORS.ADMIN.FILTERING.BUTTON_SUBMIT);
        const adminFilteringEditSaveDuration = Date.now() - adminFilteringEditSaveStart;
        adminFilteringEditSave.add(adminFilteringEditSaveDuration);
        console.log(`Admin filtering edit save duration: ${adminFilteringEditSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_register_edit_submit.png` });

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
        [`Result/filtering_${timestamp}.html`]: htmlReport(data),
    };
    if (metricsFile) {
        output[metricsFile] = JSON.stringify({
            payload: buildK6SummaryMessage(data, 'Filtering', scriptErrors.length > 0),
            scriptErrors,
        });
    }
    return output;
}