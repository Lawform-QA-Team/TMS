import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
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

        await page.goto(URLS.LOGIN.DASHBOARD);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_dashboard_home.png` });

        //엑셀 다운로드
        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.EXCEL);
        await page.click(SELECTORS.ADMIN.DASHBOARD.EXCEL);

        //통계 필터 적용
        //구분 - 접속수, 데이터 선택 - 수탁사명, 조회 단위 - 일
        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_CATEGORY); // 구분
        // select 안의 option 요소들 가져오기
        const options = await page.$$(SELECTORS.ADMIN.DASHBOARD.SELECT_CATEGORY + ' > option');
        const values = [];
        for (const opt of options) {
            const value = await opt.getAttribute('value');
            if (value !== null && value !== undefined && value !== '') {
                values.push(value);
            }
        }

        if (values.length > 0) {
            const randomValue = values[Math.floor(Math.random() * values.length)];
            await page.selectOption(SELECTORS.ADMIN.DASHBOARD.SELECT_CATEGORY, randomValue);
        }
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_select_gategory.png` });

        // await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_CATEGORY); // 데이터 선택

    } finally {
        await page.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
    return {
        [`Result/dashboard_${timestamp}.html`]: htmlReport(data),
    };
}