import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS, SELECTORS } from '../../../../url/url_base_sam.js';
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
        await wait(3000);
        let timestamp = getNewTimeStamp();
        console.log('LOGIN SUCCESS URL:', await page.url());
        await page.screenshot({ path: `screenshots/${timestamp}_login_success.png` });

        // 공지사항 페이지 이동
        await page.goto(URLS.SERVICE.NOTICE);
        await page.waitForLoadState('load');
        await wait(5000); // SPA가 필터/버튼을 렌더할 시간 확보
        console.log('NOTICE URL:', await page.url());
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_notice.png` });

        // 공지사항 등록 메뉴 진입 (id 셀렉터 우선, 실패 시 button 셀렉터)
        const registerSelector = SELECTORS.NOTICE.REGISTER;
        await page.waitForSelector(registerSelector, { state: 'visible', timeout: 1000 });
        await page.click(registerSelector);
        await wait(1000);
        console.log('NOTICE REGISTER SUCCESS URL:', await page.url());
        await page.screenshot({ path: `screenshots/${timestamp}_register.png` });

        // 공지사항 검색
        await page.goto(URLS.SERVICE.NOTICE);
        await page.waitForSelector(SELECTORS.COMMON.INPUT);
        await page.type(SELECTORS.COMMON.INPUT, '공지사항');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        await page.screenshot({ path: `screenshots/${timestamp}_search.png` });
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