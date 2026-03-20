import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import { selectDateRangeInRdpCalendar } from '../../../../common/datepicker_helper.js';
import { buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { Trend } from 'k6/metrics';

export const webDrivePageLoad = new Trend('web_drive_page_load', true);
export const webDriveCategorySearch = new Trend('web_drive_category_search', true);
export const webDriveDatepicker = new Trend('web_drive_datepicker', true);
export const webDriveSearch = new Trend('web_drive_search', true);
export const webDriveTableClick = new Trend('web_drive_table_click', true);

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

        // 문서 조회
        const webDrivePageLoadStart = Date.now();
        await page.goto(URLS.DRIVE.DRIVE);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DRIVE.png` });
        const webDrivePageLoadDuration = Date.now() - webDrivePageLoadStart;
        webDrivePageLoad.add(webDrivePageLoadDuration);
        console.log(`web_drive_page_load: ${webDrivePageLoadDuration}ms`);

        // 문서 조회, 페이지네이션
        // await page.waitForSelector(SELECTORS.WEB.DRIVE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_LAST);
        // timestamp = getNewTimeStamp();
        // await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_pagination_last.png` });
        // await page.waitForSelector(SELECTORS.WEB.DRIVE.PAGINATION);
        // await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 문서 조회, 카테고리 검색
        const webDriveCategorySearchStart = Date.now();
        await selectComboboxOption(page, SELECTORS.WEB.DRIVE.SELECT_CATEGORY);
        const webDriveCategorySearchDuration = Date.now() - webDriveCategorySearchStart;
        webDriveCategorySearch.add(webDriveCategorySearchDuration);
        console.log(`web_drive_category_search: ${webDriveCategorySearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_category.png` });
        
        // 문서 조회, 등록일 검색
        const webDriveDatepickerStart = Date.now();
        await selectDateRangeInRdpCalendar(page, SELECTORS.WEB.DRIVE.DATEPICKER, SELECTORS.WEB.DRIVE.DATEPICKER_START, '2026-02-01', '2026-02-28')
        const webDriveDatepickerDuration = Date.now() - webDriveDatepickerStart;
        webDriveDatepicker.add(webDriveDatepickerDuration);
        console.log(`web_drive_datepicker: ${webDriveDatepickerDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_datepicker.png` });

        // 문서 조회, 검색
        const webDriveSearchStart = Date.now();
        await page.waitForSelector(SELECTORS.WEB.DRIVE.INPUT);
        await page.type(SELECTORS.WEB.DRIVE.INPUT, 'heekun');
        await page.waitForSelector(SELECTORS.WEB.DRIVE.BUTTON_SEARCH);
        await page.click(SELECTORS.WEB.DRIVE.BUTTON_SEARCH);
        const webDriveSearchDuration = Date.now() - webDriveSearchStart;
        webDriveSearch.add(webDriveSearchDuration);
        console.log(`web_drive_search: ${webDriveSearchDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_search.png` });
        await page.goto(URLS.DRIVE.DRIVE);

        // 문서 조회, 테이블 클릭
        const webDriveTableClickStart = Date.now();
        await page.waitForSelector(SELECTORS.WEB.DRIVE.TABLE_LIST);
        await page.click(`${SELECTORS.COMMON.TABLE} span.cursor-pointer`);
        const webDriveTableClickDuration = Date.now() - webDriveTableClickStart;
        webDriveTableClick.add(webDriveTableClickDuration);
        console.log(`web_drive_table_click: ${webDriveTableClickDuration}ms`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_table.png` });

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
    const metricsFile = __ENV._K6_METRICS_FILE;
    const output = {
        [`Result/web_drive_${timestamp}.html`]: htmlReport(data),
    };
    if (metricsFile) {
        output[metricsFile] = JSON.stringify({
            payload: buildK6SummaryMessage(data, 'Web Drive', scriptErrors.length > 0),
            scriptErrors,
        });
    }
    return output;
}