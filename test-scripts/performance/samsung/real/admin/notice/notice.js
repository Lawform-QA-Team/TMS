import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
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
        await wait(3000);
        let timestamp = getNewTimeStamp();
        console.log('LOGIN SUCCESS URL:', await page.url());
        await page.screenshot({ path: `screenshots/${timestamp}_login_success.png` });

        // 공지사항 페이지 이동
        await page.goto(URLS.SERVICE.NOTICE);
        await page.waitForLoadState('load');
        await wait(2000); // SPA가 필터/버튼을 렌더할 시간 확보
        console.log('NOTICE URL:', await page.url());
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_notice.png` });

        // 공지사항 페이지네이션
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_pagination_last.png` });
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 공지사항 검색
        await page.waitForSelector(SELECTORS.ADMIN.NOTICE.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.NOTICE.INPUT_SEARCH, '공지사항');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(2000);
        await page.screenshot({ path: `screenshots/${timestamp}_search.png` });

        // 공지사항 테이블 클릭 -> 미구현
        // await page.goto(URLS.SERVICE.NOTICE);
        // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.TABLE_LIST);
        // await page.click(SELECTORS.COMMON.TABLE);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_table.png` });

        // 공지사항 등록 메뉴 진입 (id 셀렉터 우선, 실패 시 button 셀렉터)
        await page.goto(URLS.SERVICE.NOTICE);
        await page.waitForSelector(SELECTORS.ADMIN.NOTICE.REGISTER);
        await page.click(SELECTORS.ADMIN.NOTICE.REGISTER);
        await wait(1000);
        console.log('NOTICE REGISTER SUCCESS URL:', await page.url());
        await page.screenshot({ path: `screenshots/${timestamp}_register.png` });
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);
        await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_LIST);

        // 공지사항 등록 메뉴 작성
        await page.waitForSelector(SELECTORS.ADMIN.NOTICE.REGISTER);
        await page.click(SELECTORS.ADMIN.NOTICE.REGISTER);
        await page.waitForSelector(SELECTORS.FEATURES.NOTICE.INPUT_TITLE);
        await page.type(SELECTORS.FEATURES.NOTICE.INPUT_TITLE, '공지사항 테스트');
        await page.waitForSelector(`[contenteditable="true"]`);
        await page.type(`[contenteditable="true"]`, '문의 테스트 1');
        await page.keyboard.press('Enter')
        await page.type(`[contenteditable="true"]`, '문의 테스트 2');
        await wait(2000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_register_write.png` });
        
        // 공지사항 등록 메뉴 저장 -> 미구현
        // await page.waitForSelector(SELECTORS.FEATURES.NOTICE.BUTTON_SUBMIT);
        // await page.click(SELECTORS.FEATURES.NOTICE.BUTTON_SUBMIT);
        // await wait(2000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_NOTICE_register_submit.png` });

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
        const payload = buildK6SummaryMessage(data, 'Notice');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/notice_${timestamp}.html`]: htmlReport(data),
    };
}