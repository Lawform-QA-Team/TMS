import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { sendSlackWebhook, buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const adminMembersPageLoad = new Trend('admin_members_page_load', true);
export const adminMembersSearch = new Trend('admin_members_search', true);
export const adminMembersTableClick = new Trend('admin_members_table_click', true);
export const adminMembersEditSave = new Trend('admin_members_edit_save', true);

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

        // 사용자 관리 - 백오피스
        const adminMembersPageLoadStart = Date.now();
        await page.goto(URLS.MEMBER.BACKOFFICE);
        await wait(2000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE.png` });
        adminMembersPageLoad.add(Date.now() - adminMembersPageLoadStart);
        console.log(`Admin members page load duration: ${Date.now() - adminMembersPageLoadStart}ms`);

        // 사용자 관리 - 백오피스, 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(2000);
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
        await wait(2000);
        adminMembersSearch.add(Date.now() - adminMembersSearchStart);
        console.log(`Admin members search duration: ${Date.now() - adminMembersSearchStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_search.png` });

        // 사용자 관리 - 백오피스, 테이블 클릭
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.TABLE_LIST);
        const adminMembersTableClickStart = Date.now();
        await page.click(`${SELECTORS.COMMON.TABLE} button`);
        await wait(2000);
        adminMembersTableClick.add(Date.now() - adminMembersTableClickStart);
        console.log(`Admin members table click duration: ${Date.now() - adminMembersTableClickStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_table.png` });

        // 사용자 관리 - 백오피스, 정보 수정
        const adminMembersEditSaveStart = Date.now();
        await page.waitForLoadState('load');
        const radios = await page.$$(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO);
        await radios[0].click();
        await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_2);
        await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_2);
        await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.CHECKBOX);
        const checkboxes = await page.$$(SELECTORS.ADMIN.USER_DETAIL_PANEL.CHECKBOX);
        for (let i = 0; i <= 3; i++) {
            await checkboxes[i].click();
        }
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_edit.png` });

        // 사용자 관리 - 백오피스, 정보 저장
        await page.waitForLoadState('load');
        await radios[2].click();
        await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_1);
        await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.RADIO_1);
        await page.waitForSelector(SELECTORS.ADMIN.USER_DETAIL_PANEL.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.USER_DETAIL_PANEL.BUTTON_SAVE);
        await wait(2000);
        adminMembersEditSave.add(Date.now() - adminMembersEditSaveStart);
        console.log(`Admin members edit save duration: ${Date.now() - adminMembersEditSaveStart}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_save.png` });

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
        const payload = buildK6SummaryMessage(data, 'Members');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/members_${timestamp}.html`]: htmlReport(data),
    };
}