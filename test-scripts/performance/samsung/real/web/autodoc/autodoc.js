import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const webAutodocPageLoad = new Trend('web_autodoc_page_load', true);
export const webAutodocSearch = new Trend('web_autodoc_search', true);
export const webAutodocTableClick = new Trend('web_autodoc_table_click', true);
export const webAutodocDraftSave = new Trend('web_autodoc_draft_save', true);
export const webAutodocAiLabeling = new Trend('web_autodoc_ai_labeling', true);
export const webAutodocSave = new Trend('web_autodoc_save', true);
export const webAutodocEditSave = new Trend('web_autodoc_edit_save', true);
export const webAutodocAiChat = new Trend('web_autodoc_ai_chat', true);
export const webAutodocAutoReview = new Trend('web_autodoc_auto_review', true);

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

        // 문서 작성 - 표준 양식
        const webAutodocPageLoadStart = Date.now();
        await page.goto(URLS.AUTODOC.STANDARD);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC.png` });
        const webAutodocPageLoadDuration = Date.now() - webAutodocPageLoadStart;
        webAutodocPageLoad.add(webAutodocPageLoadDuration);
        console.log(`web_autodoc_page_load: ${webAutodocPageLoadDuration}ms`);

        // 문서 작성 - 표준 양식, 페이지네이션
        // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 문서 작성 - 표준 양식, 검색
        const webAutodocSearchStart = Date.now();
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.WEB.AUTODOC.INPUT_SEARCH, '개인정보처리방침_삼성닷컴(최종)');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const webAutodocSearchDuration = Date.now() - webAutodocSearchStart;
        webAutodocSearch.add(webAutodocSearchDuration);
        console.log(`web_autodoc_search: ${webAutodocSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_search.png` });

        // 문서 작성 - 표준 양식, 테이블 클릭
        const webAutodocTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        const webAutodocTableClickDuration = Date.now() - webAutodocTableClickStart;
        webAutodocTableClick.add(webAutodocTableClickDuration);
        console.log(`web_autodoc_table_click: ${webAutodocTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_table.png` });

        // 문서 작성 - 표준 양식, 작성
        await page.waitForSelector('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
        await page.click('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.INPUT_1);
        await page.type(SELECTORS.FEATURES.AUTODOC.INPUT_1, '문서 작성 테스트');
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_write.png` });

        // 문서 작성 - 표준 양식, 임시저장
        const webAutodocDraftSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DRAFT_SAVE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DRAFT_SAVE);
        const webAutodocDraftSaveDuration = Date.now() - webAutodocDraftSaveStart;
        webAutodocDraftSave.add(webAutodocDraftSaveDuration);
        console.log(`web_autodoc_draft_save: ${webAutodocDraftSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_submit.png` });

        // 문서 작성 - 표준 양식, 미리보기
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_PREVIEW);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_PREVIEW);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_preview.png` });
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

        // 문서 작성 - 표준 양식, AI 자동 라벨링
        const webAutodocAiLabelingStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING);
        // 클릭 후 버튼이 disabled(로딩) 상태가 될 때까지 기다림
          await page.waitForFunction(
            (selector) => {
              const el = document.querySelector(selector);
              return el && el.disabled;
            },
            SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING
          );
          // 로딩이 끝나 disabled가 해제될 때까지 기다림
          await page.waitForFunction(
            (selector) => {
              const el = document.querySelector(selector);
              return el && !el.disabled;
            },
            SELECTORS.FEATURES.AUTODOC.BUTTON_AI_AUTO_LABELING
          );
        const webAutodocAiLabelingDuration = Date.now() - webAutodocAiLabelingStart;
        webAutodocAiLabeling.add(webAutodocAiLabelingDuration);
        console.log(`web_autodoc_ai_labeling: ${webAutodocAiLabelingDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_labeling.png` });
        // await page.waitForSelector('//button[contains(text(),"라벨링 되돌리기")]');
        // await page.click('//button[contains(text(),"라벨링 되돌리기")]');

        // 문서 작성 - 표준 양식, 저장
        const webAutodocSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
        const webAutodocSaveDuration = Date.now() - webAutodocSaveStart;
        webAutodocSave.add(webAutodocSaveDuration);
        console.log(`web_autodoc_save: ${webAutodocSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_submit.png` });

        // 문서 작성 - 기존 문서, 다운로드
        // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD);
        // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_download.png` });

        // 문서 작성 - 기존 문서, 클린본 다운로드
        // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD_1);
        // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_DOWNLOAD_1);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_clean_download.png` });

        // 문서 작성 - 기존 문서, 수정모드
        const webAutodocEditSaveStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit.png` });

        // 문서 작성 - 기존 문서, 수정모드, 저장하기
        await page.waitForSelector('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
        await page.click('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.INPUT_1);
        await page.fill(SELECTORS.FEATURES.AUTODOC.INPUT_1, '문서 작성 테스트 1');
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
        await page.waitForFunction(
            (selector) => {
                const el = document.querySelector(selector);
                return !el;
            },
            SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE
        );
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_save.png` });

        // 문서 작성 - 기존 문서, 수정모드, 트래킹 끄고 저장하기
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_TRACKING_MODE);
        await page.waitForSelector('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
        await page.click('//button[@role="tab"][contains(text(),"문서 정보 작성")]');
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.INPUT_1);
        await page.fill(SELECTORS.FEATURES.AUTODOC.INPUT_1, '문서 작성 테스트 2');
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE);
        await page.waitForFunction(
            (selector) => {
                const el = document.querySelector(selector);
                return !el;
            },
            SELECTORS.FEATURES.AUTODOC.BUTTON_SAVE
        );
        const webAutodocEditSaveDuration = Date.now() - webAutodocEditSaveStart;
        webAutodocEditSave.add(webAutodocEditSaveDuration);
        console.log(`web_autodoc_edit_save: ${webAutodocEditSaveDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_tracking_off.png` });

        // 문서 작성 - 기존 문서, 수정 이력 진입
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log.png` });
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

        // 문서 작성 - 기존 문서, 수정 이력, 테이블 클릭
        // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON);
        // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON);
        // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TABLE_LIST);
        // await page.click(SELECTORS.COMMON.TABLE2);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_table.png` });

        // 문서 작성 - 기존 문서, 수정 이력, 비교하기
        // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_COMPARE);
        // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_COMPARE);
        // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TABLE_LIST);
        // await page.click(SELECTORS.COMMON.TABLE);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_compare.png` });

        // 문서 작성 - 기존 문서, 수정 이력, 불러오기 -> 확인, 취소 버튼에 tid가 없어서 진행 불가능
        // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LOAD);
        // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LOAD);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_log_load.png` });
        // await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);
        // await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_CLOSE);

        // 문서 작성 - 기존 문서
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_WRITING_EDIT_MODE);
        const webAutodocAiChatStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_EDIT);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_EDIT);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_ai.png` });

        // 문서 작성 - 기존 문서, AI 검토 * 편집, 채팅 입력
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.TEXTAREA);
        await page.type(SELECTORS.FEATURES.AUTODOC.TEXTAREA, '조항을 추가해줘');
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_SEND);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_SEND);
        // 클릭 후 버튼에 스핀이 생길 때까지 기다림
        await page.waitForFunction(
            (selector) => {
                const btn = document.querySelector(selector);
                return btn && btn.querySelector('.animate-spin');
            },
            SELECTORS.FEATURES.AUTODOC.BUTTON_SEND
        );
        // 스핀이 사라질 때까지 기다림
        await page.waitForFunction(
            (selector) => {
                const btn = document.querySelector(selector);
                return btn && !btn.querySelector('.animate-spin');
            },
            SELECTORS.FEATURES.AUTODOC.BUTTON_SEND
        );
        const webAutodocAiChatDuration = Date.now() - webAutodocAiChatStart;
        webAutodocAiChat.add(webAutodocAiChatDuration);
        console.log(`web_autodoc_ai_chat: ${webAutodocAiChatDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_send.png` });

        // 문서 작성 - 기존 문서, AI 검토 * 편집, 자동 검토
        const webAutodocAutoReviewStart = Date.now();
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_AUTO_REVIEW);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_AUTO_REVIEW);
        // 클릭 후 버튼에 스핀이 생길 때까지 기다림
        await page.waitForFunction(
            (selector) => {
                const btn = document.querySelector(selector);
                return btn && btn.querySelector('.animate-spin');
            },
            SELECTORS.FEATURES.AUTODOC.BUTTON_SEND
        );
        // 스핀이 사라질 때까지 기다림
        await page.waitForFunction(
            (selector) => {
                const btn = document.querySelector(selector);
                return btn && !btn.querySelector('.animate-spin');
            },
            SELECTORS.FEATURES.AUTODOC.BUTTON_SEND
        );
        const webAutodocAutoReviewDuration = Date.now() - webAutodocAutoReviewStart;
        webAutodocAutoReview.add(webAutodocAutoReviewDuration);
        console.log(`web_autodoc_auto_review: ${webAutodocAutoReviewDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_auto.png` });

        // 문서 작성 - 기존 문서, AI 검토 * 편집, 코멘트
        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_1);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_ai_comment.png` });
        await page.waitForSelector('button[data-appearance="outline"][data-size="sm"] svg.lucide-log-out');
        await page.click('button[data-appearance="outline"][data-size="sm"] svg.lucide-log-out');

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
        const payload = buildK6SummaryMessage(data, 'Web Autodoc', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/web_autodoc_${timestamp}.html`]: htmlReport(data),
    };
}