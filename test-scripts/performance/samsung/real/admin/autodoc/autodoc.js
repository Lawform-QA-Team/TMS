import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const adminAutodocPageLoad = new Trend('admin_autodoc_page_load', true);
export const adminAutodocSearch = new Trend('admin_autodoc_search', true);
export const adminAutodocRegister = new Trend('admin_autodoc_register', true);
export const adminAutodocTableClick = new Trend('admin_autodoc_table_click', true);

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

        // 표준 양식 관리 진입
        const adminAutodocPageLoadStart = Date.now();
        await page.goto(URLS.AUTODOC.AUTODOC);
        const adminAutodocPageLoadDuration = Date.now() - adminAutodocPageLoadStart;
        adminAutodocPageLoad.add(adminAutodocPageLoadDuration);
        console.log(`adminAutodocPageLoad duration: ${adminAutodocPageLoadDuration}ms`);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC.png` });

        // 표준 양식 테이블 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST); // 마지막 페이지 이동
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST); // 첫 페이지 이동

        // 표준 양식 검색
        const adminAutodocSearchStart = Date.now();
        await page.waitForSelector('button[data-slot="popover-trigger"]');
        await page.click('button[data-slot="popover-trigger"]');
        await page.waitForSelector('input[data-slot="input"][placeholder="카테고리 검색"]');
        await page.type('input[data-slot="input"][placeholder="카테고리 검색"]', '카테고리');
        await page.waitForSelector('button.relative.flex.w-full.cursor-pointer.items-center.rounded-sm.text-left');
        const contents = await page.$$('button.relative.flex.w-full.cursor-pointer.items-center.rounded-sm.text-left');
        await contents[Math.floor(Math.random() * contents.length)].click();
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH, '시연용');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        const adminAutodocSearchDuration = Date.now() - adminAutodocSearchStart;
        adminAutodocSearch.add(adminAutodocSearchDuration);
        console.log(`adminAutodocSearch duration: ${adminAutodocSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_search.png` });
        await page.goto(URLS.AUTODOC.AUTODOC);

        // 표준 양식 등록 진입
        const adminAutodocRegisterStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER);
        const adminAutodocRegisterDuration = Date.now() - adminAutodocRegisterStart;
        adminAutodocRegister.add(adminAutodocRegisterDuration);
        console.log(`adminAutodocRegister duration: ${adminAutodocRegisterDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_register.png` });

        // 표준 양식 등록 - 양식 유형 선택
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.SELECT_SELECTED_CATEGORY);
        await selectComboboxOption(page, SELECTORS.ADMIN.AUTODOC.SELECT_SELECTED_CATEGORY);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_register.select.png` });
        await page.goto(URLS.AUTODOC.AUTODOC);

        // 표준 양식 테이블 클릭
        const adminAutodocTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        const adminAutodocTableClickDuration = Date.now() - adminAutodocTableClickStart;
        adminAutodocTableClick.add(adminAutodocTableClickDuration);
        console.log(`adminAutodocTableClick duration: ${adminAutodocTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_table.png` });
        await page.goto(URLS.AUTODOC.AUTODOC);

        // 업데이트 추천
        await page.locator('button').filter({ hasText: '업데이트 추천' }).waitFor();
        await page.locator('button').filter({ hasText: '업데이트 추천' }).click();
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_update.png` });
        await page.goto(URLS.AUTODOC.AUTODOC);

        // 표준 양식 테이블 업데이트 클릭
        // await page.waitForSelector(`span[data-slot="badge"]`);
        // const badges = await page.$$(`span[data-slot="badge"]`);
        // await badges[0].click();
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_table_update.png` });
        // await page.goto(URLS.AUTODOC.AUTODOC);

        // 카테고리 관리
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CATEGORY_MANAGEMENT);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CATEGORY_MANAGEMENT);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category.png` });

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
        const payload = buildK6SummaryMessage(data, 'Autodoc', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }

    return {
        [`Result/autodoc_${timestamp}.html`]: htmlReport(data),
    };
}