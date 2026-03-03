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

        // 표준 양식 관리 진입
        await page.goto(URLS.AUTODOC.AUTODOC);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC.png` });
        await wait(5000);

        // 표준 양식 테이블 페이지네이션
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);

        // 표준 양식 검색
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH, '표준 양식');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_search.png` });

        // 표준 양식 등록 진입
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_register.png` });

        // 표준 양식 등록 - 양식 유형 선택
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.SELECT_SELECTED_CATEGORY);
        await selectComboboxOption(page, SELECTORS.ADMIN.AUTODOC.SELECT_SELECTED_CATEGORY);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_register.select.png` });

        // 표준 양식 테이블 클릭
        await page.goto(URLS.AUTODOC.AUTODOC);
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_table.png` });

        // 업데이트 추천
        await page.goto(URLS.AUTODOC.AUTODOC);
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_UPDATE_RECOMMEND);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_UPDATE_RECOMMEND);

        // 카테고리 관리 진입
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CATEGORY_MANAGEMENT);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CATEGORY_MANAGEMENT);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category.png` });

        // 카테고리 관리 페이지네이션
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // await wait(5000);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);
        // await wait(5000);

        // 카테고리 검색
        await page.goto(URLS.AUTODOC.CATEGORY);
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.AUTODOC.INPUT_SEARCH, '카테고리');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_search.png` });

        // 카테고리 등록
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_REGISTER_CATEGORY);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_register.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.INPUT);
        await page.type(SELECTORS.ADMIN.AUTODOC.INPUT, '카테고리 등록 테스트');
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_SAVE);

        // 카테고리 테이블 클릭
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
        await page.click(SELECTORS.ADMIN.AUTODOC.TABLE_LIST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_category_table.png` });
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.AUTODOC.BUTTON_CLOSE);
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