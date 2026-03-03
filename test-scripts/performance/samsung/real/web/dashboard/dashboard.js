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
        await wait(5000);
        await page.screenshot({ path: `screenshots/${timestamp}_excel_download.png` });
        await page.keyboard.press('Enter');

        //통계 필터 적용 (combobox: button + role="combobox")
        //구분 - 접속수, 데이터 선택 - 수탁사명, 조회 단위 - 일
        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_CATEGORY); // 구분
        await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_CATEGORY);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_select_gategory.png` });

        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_DATA_SELECT); // 데이터 선택
        await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_DATA_SELECT);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_select_gategory2.png` });

        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT); // 조회 단위
        const randomValue3 = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT);
        console.log('randomValue3 (조회 단위)', randomValue3);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_select_gategory3.png` });
        await wait(5000);

        // 조회 단위에 따른 기간 선택 (randomValue3 = 조회 단위: 일/월/분기/반기/년도)
        const queryUnit = (randomValue3 || '').trim();
        if (queryUnit.includes('일')) {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.DATEPICKER);
            const startDate = getRandomDate(365);
            const end = new Date(startDate);
            end.setDate(end.getDate() + 7);
            const endDate = end.toISOString().slice(0, 10);
            await selectDateRange(page, startDate, endDate);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_datepicker.png` });
        }
        else if (queryUnit.includes('월')) {
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
        else if (queryUnit.includes('분기')) {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT);
            const randomValue_year = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_year_${randomValue_year || 'unknown'}.png` });

            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
            const randomValue_quarter = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_quarter_${randomValue_quarter || 'unknown'}.png` });
        }
        else if (queryUnit.includes('반기')) {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT);
            const randomValue_year2 = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_year2_${randomValue_year2 || 'unknown'}.png` });
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
            const randomValue_half = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_half_${randomValue_half || 'unknown'}.png` });
        }
        else if (queryUnit.includes('년도') || queryUnit.includes('연')) {
            await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT);
            const randomValue_year3 = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_select_year_${randomValue_year3 || 'unknown'}.png` });
        }
        
        await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.BUTTON_SEARCH);
        await page.click(SELECTORS.ADMIN.DASHBOARD.BUTTON_SEARCH);
        
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