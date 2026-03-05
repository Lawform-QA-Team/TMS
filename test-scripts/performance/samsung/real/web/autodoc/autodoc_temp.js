import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../../admin/login/login_helper.js';

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

        // 문서 작성 - 임시 저장 문서
        await page.goto(URLS.AUTODOC.TEMP);
        await wait(5000);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp.png` });

        // 문서 작성 - 임시 저장 문서, 페이지네이션
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_pagination_last.png` });
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 문서 작성 - 임시 저장 문서, 검색
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.WEB.AUTODOC.INPUT_SEARCH, '테스트');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_search.png` });
        await page.goto(URLS.AUTODOC.TEMP);

        // 문서 작성 - 임시 저장 문서, 테이블 클릭
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_temp_table.png` });

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