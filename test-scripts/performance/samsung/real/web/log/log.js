import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

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
    const page = await browser.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);

        // 로그
        await page.goto(URLS.LOG.LOG);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_LOG.png` });
        await wait(5000);

        // 로그, 페이지네이션
        await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_LOG_pagination_last.png` });
        await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 로그, 검색
        // await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.BUTTON);
        // await page.click(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.BUTTON);
        // await selectDateRangeInRdpCalendar(page, '시작 데이트 피커', '끝 데이트 피커', '2026-02-01', '2026-02-28')
        await selectComboboxOption(page, SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_EVENT)
        await selectComboboxOption(page, SELECTORS.ADMIN.USER_ACTIVITY_TABLE.SELECT_STATUS)
        await page.waitForSelector(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.USER_ACTIVITY_TABLE.INPUT_SEARCH, 'a');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_LOG_search.png` });

    } finally {
        await page.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
    return {
        [`Result/notice_${timestamp}.html`]: htmlReport(data),
    };
}