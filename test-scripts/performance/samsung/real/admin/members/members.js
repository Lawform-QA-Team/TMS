import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const adminMembersPageLoad = new Trend('admin_members_page_load', true);
export const adminMembersSearch = new Trend('admin_members_search', true);
export const adminMembersTableClick = new Trend('admin_members_table_click', true);
export const adminMembersEditSave = new Trend('admin_members_edit_save', true);

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

        // 사용자 관리 - 백오피스
        const adminMembersPageLoadStart = Date.now();
        await page.goto(URLS.MEMBER.BACKOFFICE);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE.png` });
        const adminMembersPageLoadDuration = Date.now() - adminMembersPageLoadStart;
        adminMembersPageLoad.add(adminMembersPageLoadDuration);
        console.log(`Admin members page load duration: ${adminMembersPageLoadDuration}ms`);

        // 사용자 관리 - 백오피스, 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 사용자 관리 - 백오피스, 검색
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH);
        const adminMembersSearchStart = Date.now();
        await page.type(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH, '임희건');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const adminMembersSearchDuration = Date.now() - adminMembersSearchStart;
        adminMembersSearch.add(adminMembersSearchDuration);
        console.log(`Admin members search duration: ${adminMembersSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_search.png` });

        // 사용자 관리 - 백오피스, 테이블 클릭
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.TABLE_LIST);
        const adminMembersTableClickStart = Date.now();
        await page.click(`${SELECTORS.COMMON.TABLE} button`);
        const adminMembersTableClickDuration = Date.now() - adminMembersTableClickStart;
        adminMembersTableClick.add(adminMembersTableClickDuration);
        console.log(`Admin members table click duration: ${adminMembersTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_table.png` });

        // 사용자 관리 - 백오피스, 정보 수정
        const adminMembersEditSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO);
        const radios = await page.$$(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO);
        await radios[0].click();
        await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_2);
        await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_2);
        await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.CHECKBOX);
        const checkboxes = await page.$$(SELECTORS.ADMIN.USER_DETAIL_PANEL.CHECKBOX);
        for (let i = 0; i <= 3; i++) {
            await checkboxes[i].click();
        }
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_edit.png` });

        // 사용자 관리 - 백오피스, 정보 저장
        await page.waitForLoadState('load');
        await radios[2].click();
        await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_1);
        await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_1);
        await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.BUTTON_SAVE);
        const adminMembersEditSaveDuration = Date.now() - adminMembersEditSaveStart;
        adminMembersEditSave.add(adminMembersEditSaveDuration);
        console.log(`Admin members edit save duration: ${adminMembersEditSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_save.png` });

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
        [`Result/members_${timestamp}.html`]: htmlReport(data),
    };
    if (metricsFile) {
        output[metricsFile] = JSON.stringify({
            payload: buildK6SummaryMessage(data, 'Members', scriptErrors.length > 0),
            scriptErrors,
        });
    }
    return output;
}