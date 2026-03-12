import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import http from 'k6/http';
import { check } from 'k6';
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import {
    selectRandomDateFromRdpCalendar,
    selectDateInRdpCalendar,
} from '../../../../common/datepicker_helper.js';
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
                    args: [
                        '--disable-features=DownloadBubble,DownloadBubbleV2', // 최신 크롬 다운로드 알림 끄기
                        '--no-sandbox',
                        '--disable-setuid-sandbox'
                    ],
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

/** YYYY-MM-DD 형식의 임의 날짜 생성 (과거 N일 이내) */
function getRandomDate(daysBack = 365) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
    return d.toISOString().slice(0, 10);
}

/** RDP 캘린더에서 기간 선택 (일 단위: 시작일~종료일) */
async function selectDateRangeInRdp(page, startDate, endDate) {
    const wrap = SELECTORS.ADMIN.DASHBOARD.DATEPICKER;
    const inputs = await page.$$(`${wrap} input`);
    if (inputs.length >= 2) {
        await selectDateInRdpCalendar(page, page.locator(`${wrap} input`).first(), startDate);
        await wait(300);
        await selectDateInRdpCalendar(page, page.locator(`${wrap} input`).nth(1), endDate);
    } else {
        await selectRandomDateFromRdpCalendar(page, wrap);
    }
}

/** 월 선택: input[type="month"]의 value를 직접 설정 */
async function selectMonthInPicker(page, year, month) {
    const monthValue = `${year}-${String(month).padStart(2, '0')}`;
    const input = page.locator('input[type="month"]');
    await input.evaluate((el, val) => {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }, monthValue);
    await wait(200);
}

export default async function() {
    const context = await browser.newContext({
        acceptDownloads: true,
        viewport: { width: 1960, height: 1080 },
    });
    const page = await context.newPage();
    let downloadUrl = null;

    page.on('response', (response) => {
        const disposition = response.headers()['content-disposition'];
        if (disposition && disposition.includes('attachment')) {
            downloadUrl = response.url();
            console.log('Download URL:', downloadUrl);
        }
    });

    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);
        await page.goto(URLS.LOGIN.DASHBOARD);

        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_dashboard_home.png` });

        // await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.EXCEL);
        // await page.click(SELECTORS.ADMIN.DASHBOARD.EXCEL);
        // await page.waitForTimeout(2000);

        // const cookies = await context.cookies();
        // const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
        // console.log('Cookie Header:', cookieHeader);

        // if (downloadUrl) {
        //     const result = await page.evaluate(async (url) => {
        //         try {
        //             const response = await fetch(url, {
        //                 method: 'GET',
        //                 credentials: 'include', // 브라우저 쿠키/토큰 그대로 사용
        //             });
        //             const blob = await response.blob();
        //             return {
        //                 status: response.status,
        //                 contentType: response.headers.get('content-type'),
        //                 size: blob.size,
        //             };
        //         } catch (e) {
        //             return { error: e.message };
        //         }
        //     }, downloadUrl);

        //     console.log('Status:', result.status);
        //     console.log('Content-Type:', result.contentType);
        //     console.log('File size (bytes):', result.size);

        //     check(result, {
        //         'download status 200': (r) => r.status === 200,
        //         'file size > 1KB': (r) => r.size > 1024,
        //         'content-type is xlsx': (r) =>
        //             r.contentType &&
        //             r.contentType.includes(
        //                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        //             ),
        //     });
        // } else {
        //     console.error('❌ downloadUrl 캐치 실패');
        //     check(null, { 'downloadUrl 캐치 성공': () => false });
        // }
        // await page.screenshot({ path: `screenshots/${timestamp}_excel_download.png` });

        //통계 필터 적용 (combobox: button + role="combobox")
        //구분 - 접속수, 데이터 선택 - 수탁사명, 조회 단위 - 일
        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_CATEGORY); // 구분
        await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_CATEGORY);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_select_gategory.png` });

        const dataSelectEl = await page.$(SELECTORS.ADMIN.DASHBOARD.SELECT_DATA_SELECT);
        if (dataSelectEl) {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_DATA_SELECT); // 데이터 선택
            await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_DATA_SELECT);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_gategory2.png` });
        }

        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT); // 조회 단위
        const randomValue3 = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT);
        console.log('randomValue3 (조회 단위)', randomValue3);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_select_gategory3.png` });
        await wait(2000);

        // 조회 단위에 따른 기간 선택 (randomValue3 = 조회 단위: 일/월/분기/반기/년도)
        const queryUnit = (randomValue3 || '').trim();
        console.log('queryUnit', queryUnit);
        if (queryUnit.includes('일')) {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.DATEPICKER);
            const startDate = getRandomDate(365);
            const end = new Date(startDate);
            end.setDate(end.getDate() + 7);
            const endDate = end.toISOString().slice(0, 10);
            await selectDateRangeInRdp(page, startDate, endDate);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_datepicker.png` });
        }
        else if (queryUnit.includes('월')) {
            await page.waitForSelector('input[type="month"]');
            // 월 단위: 월 선택 캘린더에서 연도·월 클릭 (1~12월 그리드)
            const d = new Date();
            d.setMonth(d.getMonth() - Math.floor(Math.random() * 12));
            const y = d.getFullYear();
            const m = d.getMonth() + 1; // 1~12
            await selectMonthInPicker(page, y, m);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_datepicker_month.png` });
        }
        else if (queryUnit.includes('분기')) {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
            const randomValue_year = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1, { nth: 0 });
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_year_${randomValue_year || 'unknown'}.png` });

            const randomValue_quarter = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1, { nth: 1 });
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_quarter_${randomValue_quarter || 'unknown'}.png` });
        }
        else if (queryUnit.includes('반기')) {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
            const randomValue_year2 = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1, { nth: 0 });
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_year2_${randomValue_year2 || 'unknown'}.png` });
            const randomValue_half = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1, { nth: 1 });
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_half_${randomValue_half || 'unknown'}.png` });
        }
        else if (queryUnit.includes('년도') || queryUnit.includes('연')) {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
            const randomValue_year3 = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1, { nth: 1 });
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_year_${randomValue_year3 || 'unknown'}.png` });
        }
        
        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.BUTTON_SEARCH);
        await page.click(SELECTORS.ADMIN.DASHBOARD.BUTTON_SEARCH);
        
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
        const payload = buildK6SummaryMessage(data, 'Dashboard');
        const result = sendSlackWebhook(slackWebhookUrl, payload);
        if (!result.ok) {
            console.warn(`[Slack] 메시지 발송 실패 (status: ${result.status})`);
        }
    }

    return {
        [`Result/dashboard_${timestamp}.html`]: htmlReport(data),
    };
}