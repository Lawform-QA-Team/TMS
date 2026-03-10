import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectRandomDateFromRdpCalendar, selectDateRangeInRdpCalendar } from '../../../../common/datepicker_helper.js';
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

        // 약관 관리 - 개인정보처리방침
        await page.goto(URLS.SERVICE.PRIVACY);
        await wait(2000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY.png` });

        // 약관 관리 - 개인정보처리방침, 페이지네이션
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_pagination_last.png` });
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 약관 관리 - 개인정보처리방침, 검색
        await selectDateRangeInRdpCalendar(page, SELECTORS.ADMIN.TERMS.DATEPICKER, SELECTORS.ADMIN.TERMS.DATEPICKER_START, '2026-02-01', '2026-02-28')
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_SEARCH);
        await page.click(SELECTORS.ADMIN.TERMS.BUTTON_SEARCH);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_search.png` });
        await page.goto(URLS.SERVICE.PRIVACY);
        
        // 약관 관리 - 개인정보처리방침, 등록 진입
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_register.png` });
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_LIST);
        await page.click(SELECTORS.ADMIN.TERMS.BUTTON_LIST);

        // 약관 관리 - 개인정보처리방침, 등록 작성
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.TERMS.BUTTON_REGISTER);
        await selectRandomDateFromRdpCalendar(page, SELECTORS.ADMIN.TERMS.DATEPICKER_REVISION_DATE)
        await page.waitForSelector(`[contenteditable="true"]`);
        await page.type(`[contenteditable="true"]`, '개인정보처리방침 테스트 1');
        await page.keyboard.press('Enter')
        await page.type(`[contenteditable="true"]`, '개인정보처리방침 테스트 2');
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_register_write.png` });
        
        // 약관 관리 - 개인정보처리방침, 등록
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
        await page.click(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_register_submit.png` });

        // 약관 관리 - 개인정보처리방침, 테이블 클릭
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_table.png` });
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_LIST);
        await page.click(SELECTORS.ADMIN.TERMS.BUTTON_LIST);

        // 약관 관리 - 개인정보처리방침, 상세 수정
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.RADIO_VISIBILITY_N);
        await page.click(SELECTORS.ADMIN.TERMS.RADIO_VISIBILITY_N);
        await selectRandomDateFromRdpCalendar(page, SELECTORS.ADMIN.TERMS.DATEPICKER_REVISION_DATE)
        await page.waitForSelector(`[contenteditable="true"]`);
        await page.type(`[contenteditable="true"]`, '수정 테스트');
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_edit.png` });

        // 약관 관리 - 개인정보처리방침, 상세 수정 저장
        await page.waitForSelector(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
        await page.click(SELECTORS.ADMIN.TERMS.BUTTON_SUBMIT);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_SERVICE_PRIVACY_edit_submit.png` });

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
        const payload = buildK6SummaryMessage(data, 'Service');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/service_terms_${timestamp}.html`]: htmlReport(data),
    };
}