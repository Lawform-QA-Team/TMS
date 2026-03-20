import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const adminNoticePageLoad = new Trend('admin_notice_page_load', true);
export const adminNoticeSearch = new Trend('admin_notice_search', true);
export const adminNoticeRegisterSave = new Trend('admin_notice_register_save', true);
export const adminNoticeTableClick = new Trend('admin_notice_table_click', true);
export const adminNoticeEditSave = new Trend('admin_notice_edit_save', true);

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

        // 공지사항 페이지 이동
        const adminNoticePageLoadStart = Date.now();
        await page.goto(URLS.SERVICE.NOTICE);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_notice.png` });
        const adminNoticePageLoadDuration = Date.now() - adminNoticePageLoadStart;
        adminNoticePageLoad.add(adminNoticePageLoadDuration);
        console.log(`Admin notice page load duration: ${adminNoticePageLoadDuration}ms`);

        // 공지사항 페이지네이션
        // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 공지사항 검색
        await page.waitForSelector(SELECTORS.ADMIN.NOTICE.INPUT_SEARCH);
        const adminNoticeSearchStart = Date.now();
        await page.type(SELECTORS.ADMIN.NOTICE.INPUT_SEARCH, '공지');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const adminNoticeSearchDuration = Date.now() - adminNoticeSearchStart;
        adminNoticeSearch.add(adminNoticeSearchDuration);
        console.log(`Admin notice search duration: ${adminNoticeSearchDuration}ms`);
        await page.screenshot({ path: `screenshots/${timestamp}_search.png` });
        await page.goto(URLS.SERVICE.NOTICE);

        // 공지사항 등록 진입 (id 셀렉터 우선, 실패 시 button 셀렉터)
        await page.waitForSelector(SELECTORS.ADMIN.NOTICE.REGISTER);
        await page.click(SELECTORS.ADMIN.NOTICE.REGISTER);
        console.log('NOTICE REGISTER SUCCESS URL:', await page.url());
        await page.screenshot({ path: `screenshots/${timestamp}_register.png` });
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);

        // 공지사항 등록 작성
        const adminNoticeRegisterSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.NOTICE.REGISTER);
        await page.click(SELECTORS.ADMIN.NOTICE.REGISTER);
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.INPUT_TITLE);
        await page.locator(SELECTORS.FEATURES.NOTICE.INPUT_TITLE).fill('공지사항 테스트');
        await page.waitForSelector(`[contenteditable="true"]`);
        await page.locator(`[contenteditable="true"]`).first().fill('문의 테스트 1');
        await page.keyboard.press('Enter');
        await page.locator(`[contenteditable="true"]`).first().type('문의 테스트 2');
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_register_write.png` });
        
        // 공지사항 등록 저장
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_SUBMIT);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_SUBMIT);
        const adminNoticeRegisterSaveDuration = Date.now() - adminNoticeRegisterSaveStart;
        adminNoticeRegisterSave.add(adminNoticeRegisterSaveDuration);
        console.log(`Admin notice register save duration: ${adminNoticeRegisterSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_register_submit.png` });

        // 공지사항 테이블 클릭
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.TABLE_LIST);
        const adminNoticeTableClickStart = Date.now();
        await page.click(SELECTORS.COMMON.TABLE);
        const adminNoticeTableClickDuration = Date.now() - adminNoticeTableClickStart;
        adminNoticeTableClick.add(adminNoticeTableClickDuration);
        console.log(`Admin notice table click duration: ${adminNoticeTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_table.png` });
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);

        // 공지사항 수정이력
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_VIEW_HISTORY);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_history.png` });
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_CLOSE);

        // 공지사항 수정
        const adminNoticeEditSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.RADIO_VISIBILITY_N);
        await page.click(SELECTORS.FEATURES.NOTICE.RADIO_VISIBILITY_N);
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.INPUT_TITLE);
        await page.locator(SELECTORS.FEATURES.NOTICE.INPUT_TITLE).fill('공지사항 수정');
        await page.waitForSelector(`[contenteditable="true"]`);
        await page.locator(`[contenteditable="true"]`).first().type('문의 수정');
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_edit.png` });

        // 공지사항 수정 저장
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_SUBMIT);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_SUBMIT);
        const adminNoticeEditSaveDuration = Date.now() - adminNoticeEditSaveStart;
        adminNoticeEditSave.add(adminNoticeEditSaveDuration);
        console.log(`Admin notice edit save duration: ${adminNoticeEditSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_edit_submit.png` });

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
        const payload = buildK6SummaryMessage(data, 'Notice', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/notice_${timestamp}.html`]: htmlReport(data),
    };
}