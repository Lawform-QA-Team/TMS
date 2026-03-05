import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../../admin/login/login_helper.js';
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
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);

        // 문서 작성 - 기존 문서
        await page.goto(URLS.AUTODOC.EXISTING);
        await wait(5000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing.png` });

        // 문서 작성 - 기존 문서, 페이지네이션
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_pagination_last.png` });
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 문서 작성 - 기존 문서, 검색
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.WEB.AUTODOC.INPUT_SEARCH, '테스트');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_search.png` });
        await page.goto(URLS.AUTODOC.EXISTING);

        // 문서 작성 - 기존 문서, 테이블 클릭
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_table.png` });

        // 문서 작성 - 기존 문서, 다운로드
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_download.png` });

        // 문서 작성 - 기존 문서, 클린본 다운로드
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD_1);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD_1);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_clean_download.png` });

        // 문서 작성 - 기존 문서, 수정모드
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit.png` });
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);

        // 문서 작성 - 기존 문서, 수정모드, 저장하기
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
            // 내용을 작성했다고 가정
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
        await wait(1000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_save.png` });

        // 문서 작성 - 기존 문서, 트래킹
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
            // 내용을 작성했다고 가정
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
        await wait(1000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_tracking.png` });
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);

        // 문서 작성 - 기존 문서, 수정 이력 진입
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log.png` });
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

        // 문서 작성 - 기존 문서, 수정 이력, 테이블 클릭
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON);
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE2);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_table.png` });

        // 문서 작성 - 기존 문서, 수정 이력, 비교하기
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_COMPARE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_COMPARE);
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_compare.png` });

        // 문서 작성 - 기존 문서, 수정 이력, 불러오기 -> 확인, 취소 버튼에 tid가 없어서 진행 불가능
        // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LOAD);
        // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LOAD);
        // await wait(1000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_load.png` });
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

        // 문서 작성 - 기존 문서, AI 검토 * 편집
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_EDIT);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_EDIT);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_ai.png` });

        // 문서 작성 - 기존 문서, AI 검토 * 편집, 채팅 입력
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TEXTAREA);
        await page.type(SELECTORS.FEATURES.AUTODOC.TEXTAREA, '조항을 추가해줘');
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SEND);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SEND);
        await wait(20000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_ai_send.png` });

        // 문서 작성 - 기존 문서, AI 검토 * 편집, 자동 검토
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_AUTO_REVIEW);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_AUTO_REVIEW);
        await wait(20000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_ai_auto.png` });

        // 문서 작성 - 기존 문서, AI 검토 * 편집, 코멘트
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_ai_comment.png` });
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_1);

    } finally {
        await page.close();
        if (context) await context.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');

    // 결과 추출 및 Slack 발송
    const slackWebhookUrl = __ENV.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
        const payload = buildK6SummaryMessage(data, 'Web Autodoc existing');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/notice_${timestamp}.html`]: htmlReport(data),
    };
}