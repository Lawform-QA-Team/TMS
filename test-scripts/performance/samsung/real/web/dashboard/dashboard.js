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

/** YYYY-MM-DD 형식의 임의 날짜 생성 (과거 N일 이내) */
function getRandomDate(daysBack = 365) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
    return d.toISOString().slice(0, 10);
}

/** 기간 선택: datepicker 내부 input에 시작일/종료일 채우기 (일 단위용) */
async function selectDateRange(page, startDate, endDate) {
    const wrap = SELECTORS.ADMIN.DASHBOARD.DATEPICKER;
    const inputs = await page.$$(`${wrap} input`);
    if (inputs.length >= 2) {
        await page.locator(`${wrap} input`).first().fill(startDate);
        await page.locator(`${wrap} input`).nth(1).fill(endDate);
    } else if (inputs.length === 1) {
        await page.locator(`${wrap} input`).fill(startDate);
    }
}

/** 월 선택 캘린더에서 연도·월 선택 (팝업 열린 뒤 N월 버튼 클릭) */
async function selectMonthInPicker(page, year, month) {
    await page.locator(SELECTORS.ADMIN.DASHBOARD.DATEPICKER).click();
    await wait(300);
    // 연도 입력이 있으면 먼저 채움 (선택 사항)
    const yearInput = page.locator('input[type="number"], input[placeholder*="년"]').first();
    if (await yearInput.isVisible().catch(() => false)) {
        await yearInput.fill(String(year));
        await wait(200);
    }
    // "N월" 버튼 클릭 (exact로 1월/10월 구분)
    const monthLabel = `${month}월`;
    await page.getByText(monthLabel, { exact: true }).click();
    await wait(200);
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

        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_DATA_SELECT); // 데이터 선택

        const options2 = await page.$$(SELECTORS.ADMIN.DASHBOARD.SELECT_DATA_SELECT + ' > option');
        const values2 = [];
        for (const opt of options2) {
            const value2 = await opt.getAttribute('value');
            if (value2 !== null && value2 !== undefined && value2 !== '') {
                values2.push(value2);
            }
        }
        if (values2.length > 0) {
            const randomValue2 = values2[Math.floor(Math.random() * values2.length)];
            await page.selectOption(SELECTORS.ADMIN.DASHBOARD.SELECT_DATA_SELECT, randomValue2);
        }
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_select_gategory2.png` });

        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT); // 조회 단위
        
        const options3 = await page.$$(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT + ' > option');
        const values3 = [];
        for (const opt of options3) {
            const value3 = await opt.getAttribute('value');
            if (value3 !== null && value3 !== undefined && value3 !== '') {
                values3.push(value3);
            }
        }
        let randomValue3 = null;
        if (values3.length > 0) {
            randomValue3 = values3[Math.floor(Math.random() * values3.length)];
            await page.selectOption(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT, randomValue3);
        }
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_select_gategory3.png` });
        await wait(5000);

        // 조회 단위에 따른 기간 선택 (randomValue3 = 조회 단위: 일/월/분기/반기)
        if (randomValue3 === '일') {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.DATEPICKER);
            const startDate = getRandomDate(365);
            const end = new Date(startDate);
            end.setDate(end.getDate() + 7);
            const endDate = end.toISOString().slice(0, 10);
            await selectDateRange(page, startDate, endDate);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_datepicker.png` });
        }
        else if (randomValue3 === '월') {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.DATEPICKER);
            // 월 단위: 월 선택 캘린더에서 연도·월 클릭 (1~12월 그리드)
            const d = new Date();
            d.setMonth(d.getMonth() - Math.floor(Math.random() * 12));
            const y = d.getFullYear();
            const m = d.getMonth() + 1; // 1~12
            await selectMonthInPicker(page, y, m);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_datepicker_month.png` });
        }
        else if (randomValue3 === '분기') {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT);
            const options_year = await page.$$(SELECTORS.ADMIN.DASHBOARD.SELECT + ' > option');
            const values_year = [];
            for (const opt of options_year) {
                const values_year = await opt.getAttribute('value');
                if (values_year !== null && values_year !== undefined && values_year !== '') {
                    values_year.push(values_year);
                }
            }
            if (values_year.length > 0) {
                const randomValue_year = values_year[Math.floor(Math.random() * values_year.length)];
                await page.selectOption(SELECTORS.ADMIN.DASHBOARD.SELECT, randomValue_year);
            }
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_year_${randomValue_year}.png` });

            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_1);
            const options_quarter = await page.$$(SELECTORS.ADMIN.DASHBOARD.SELECT_1 + ' > option');
            const values_quarter = [];
            for (const opt of options_quarter) {
                const values_quarter = await opt.getAttribute('value');
                if (values_quarter !== null && values_quarter !== undefined && values_quarter !== '') {
                    values_quarter.push(values_quarter);
                }
            }
            if (values_quarter.length > 0) {
                const randomValue_quarter = values_quarter[Math.floor(Math.random() * values_quarter.length)];
                await page.selectOption(SELECTORS.ADMIN.DASHBOARD.SELECT_1, randomValue_quarter);
            }
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_quarter_${randomValue_quarter}.png` });
        }
        else if (randomValue3 === '반기') {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_2);
            const options_year2 = await page.$$(SELECTORS.ADMIN.DASHBOARD.SELECT_2 + ' > option');
            const values_year2 = [];
            for (const opt of options_year2) {
                const values_year2 = await opt.getAttribute('value');
                if (values_year2 !== null && values_year2 !== undefined && values_year2 !== '') {
                    values_year2.push(values_year2);
                }
            }
            if (values_year2.length > 0) {
                const randomValue_year2 = values_year2[Math.floor(Math.random() * values_year2.length)];
                await page.selectOption(SELECTORS.ADMIN.DASHBOARD.SELECT_2, randomValue_year2);
            }
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_year2_${randomValue_year2}.png` });
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_3);
            const options_half = await page.$$(SELECTORS.ADMIN.DASHBOARD.SELECT_3 + ' > option');
            const values_half = [];
            for (const opt of options_half) {
                const values_half = await opt.getAttribute('value');
                if (values_half !== null && values_half !== undefined && values_half !== '') {
                    values_half.push(values_half);
                }
            }
            if (values_half.length > 0) {
                const randomValue_half = values_half[Math.floor(Math.random() * values_half.length)];
                await page.selectOption(SELECTORS.ADMIN.DASHBOARD.SELECT_3, randomValue_half);
            }
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_half_${randomValue_half}.png` });            
            
        }
        else if (randomValue3 === '년도') {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_4);
            const options_year3 = await page.$$(SELECTORS.ADMIN.DASHBOARD.SELECT_4 + ' > option');
            const values_year3 = [];
            for (const opt of options_year3) {
                const values_year3 = await opt.getAttribute('value');
                if (values_year3 !== null && values_year3 !== undefined && values_year3 !== '') {
                    values_year3.push(values_year3);
                }
            }
            if (values_year3.length > 0) {
                const randomValue_year3 = values_year3[Math.floor(Math.random() * values_year3.length)];
                await page.selectOption(SELECTORS.ADMIN.DASHBOARD.SELECT_4, randomValue_year3);
            }
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_year_${randomValue_year3}.png` });
        }
        
        
        
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