import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const aiExtCoPageLoad = new Trend('admin_ai_ext_co_page_load', true);
export const aiExtCoSearch = new Trend('admin_ai_ext_co_search', true);
export const aiExtCoRegisterSave = new Trend('admin_ai_ext_co_register_save', true);
export const aiExtCoTableClick = new Trend('admin_ai_ext_co_table_click', true);
export const aiExtCoDetail = new Trend('admin_ai_ext_co_detail', true);
export const aiExtCoDelete = new Trend('admin_ai_ext_co_delete', true);

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

        // AI 외부 데이터 관리 - 타사 문서 진입
        const aiExtCoPageLoadStart = Date.now();
        await page.goto(URLS.AI_DATA.COMPANY);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company.png` });
        const aiExtCoPageLoadDuration = Date.now() - aiExtCoPageLoadStart;
        aiExtCoPageLoad.add(aiExtCoPageLoadDuration);
        console.log(`aiExtCoPageLoad duration: ${aiExtCoPageLoadDuration}ms`);

        // AI 외부 데이터 관리 - 타사 문서 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // AI 외부 데이터 관리 - 타사 문서 검색
        const aiExtCoSearchStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_SEARCH, '타사');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const aiExtCoSearchDuration = Date.now() - aiExtCoSearchStart;
        aiExtCoSearch.add(aiExtCoSearchDuration);
        console.log(`aiExtCoSearch duration: ${aiExtCoSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_search.png` });
        await page.goto(URLS.AI_DATA.COMPANY);

        // AI 외부 데이터 관리 - 타사 문서 등록 진입
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_GO_BACK);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_GO_BACK);
        await page.goto(URLS.AI_DATA.COMPANY);

        // AI 외부 데이터 관리 - 타사 문서 등록 작성
        const aiExtCoRegisterSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_REGISTER);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_CATEGORY);
        await page.type(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_CATEGORY, '타사 문서 등록 테스트');
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_URL);
        await page.type(SELECTORS.ADMIN.AI_EXTERNAL_DATA.INPUT_URL, 'https://www.google.com');
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register_write.png` });

        // AI 외부 데이터 관리 - 텍스트 추출
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_EXTRACT_TEXT);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_EXTRACT_TEXT);
        await page.waitForFunction(
            (selector) => {
                const el = document.querySelector(selector);
                return el && !el.disabled;
            },
            {},
            SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_EXTRACT_TEXT
        );
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register_extract.png` });
        await page.keyboard.press('Escape');

        // AI 외부 데이터 관리 - 미리보기
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_PREVIEW);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_PREVIEW);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register_preview.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_CLOSE);

        // AI 외부 데이터 관리 - 타사 문서 등록
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_SUBMIT);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_SUBMIT);
        await page.goto(URLS.AI_DATA.COMPANY);
        const aiExtCoRegisterSaveDuration = Date.now() - aiExtCoRegisterSaveStart;
        aiExtCoRegisterSave.add(aiExtCoRegisterSaveDuration);
        console.log(`aiExtCoRegisterSave duration: ${aiExtCoRegisterSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_register_submit.png` });

        // AI 외부 데이터 관리 - 타사 문서 테이블 클릭
        const aiExtCoTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.TABLE_LIST);
        await page.click(`${SELECTORS.COMMON.TABLE} div.cursor-pointer`);
        const aiExtCoTableClickDuration = Date.now() - aiExtCoTableClickStart;
        aiExtCoTableClick.add(aiExtCoTableClickDuration);
        console.log(`aiExtCoTableClick duration: ${aiExtCoTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_table_click.png` });

        // AI 외부 데이터 관리 - 타사 문서 상세
        const aiExtCoDetailStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.SWITCH);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_VIEW);
        const views = await page.$$(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_VIEW);
        if (views.length >= 2) {
            await views[Math.floor(Math.random() * (views.length - 1)) + 1].click();
        }
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_table_detail.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_LIST);
        await page.goto(URLS.AI_DATA.COMPANY);
        const aiExtCoDetailDuration = Date.now() - aiExtCoDetailStart;
        aiExtCoDetail.add(aiExtCoDetailDuration);
        console.log(`aiExtCoDetail duration: ${aiExtCoDetailDuration}ms`);

        // AI 외부 데이터 관리 - 타사 문서 체크 박스
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_checkbox.png` });
        await page.goto(URLS.AI_DATA.COMPANY);

        // AI 외부 데이터 관리 - 타사 문서 선택 문서 삭제
        const aiExtCoDeleteStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.CHECKBOX_1);
        await page.waitForSelector(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
        await page.click(SELECTORS.ADMIN.AI_EXTERNAL_DATA.BUTTON_DELETE);
        const aiExtCoDeleteDuration = Date.now() - aiExtCoDeleteStart;
        aiExtCoDelete.add(aiExtCoDeleteDuration);
        console.log(`aiExtCoDelete duration: ${aiExtCoDeleteDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AI_EXTERNAL_DATA_company_delete.png` });

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

    // Slack Bot API 발송
    const token = __ENV.SLACK_BOT_TOKEN;
    const channel = __ENV.SLACK_CHANNEL_ID;
    if (token && channel) {
        const payload = buildK6SummaryMessage(data, 'AI External Data Company', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/ai_external_data_company_${timestamp}.html`]: htmlReport(data),
    };
}