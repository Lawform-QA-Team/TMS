import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../selector_hsad.js';
import { hsadBrowserOptions, loginToDashboard, measure } from '../common/k6_browser_helpers.js';

export const options = hsadBrowserOptions;

const gnbDashboardLoad    = new Trend('hsad_gnb_dashboard_load');
const gnbClmLoad          = new Trend('hsad_gnb_clm_load');
const gnbAdviceLoad       = new Trend('hsad_gnb_advice_load');
const gnbSealLoad         = new Trend('hsad_gnb_seal_load');
const gnbLitigationLoad   = new Trend('hsad_gnb_litigation_load');
const gnbLawLoad          = new Trend('hsad_gnb_law_load');
const gnbProjectLoad      = new Trend('hsad_gnb_project_load');
const gnbDriveLoad        = new Trend('hsad_gnb_drive_load');
const gnbSettingLoad      = new Trend('hsad_gnb_setting_load');

export default async function () {
    const page = await browser.newPage();
    try {
        await loginToDashboard(page, URLS, SELECTORS);

        await measure(gnbDashboardLoad,  () => page.goto(URLS.LOGIN.DASHBOARD));
        check(page, { 'GNB: 대시보드':   () => page.url().includes('/dashboard') });

        await measure(gnbClmLoad,        () => page.goto(URLS.CLM.DRAFT));
        check(page, { 'GNB: CLM':         () => page.url().includes('/clm') });

        await measure(gnbAdviceLoad,     () => page.goto(URLS.ADVICE.DRAFT));
        check(page, { 'GNB: 법률 자문':  () => page.url().includes('/advice') });

        await measure(gnbSealLoad,       () => page.goto(URLS.SEAL.DRAFT));
        check(page, { 'GNB: 인감':       () => page.url().includes('/seal') });

        await measure(gnbLitigationLoad, () => page.goto(URLS.LITIGATION.DRAFT));
        check(page, { 'GNB: 송무':       () => page.url().includes('/litigation') });

        await measure(gnbLawLoad,        () => page.goto(URLS.LAW.SCHEDULE));
        check(page, { 'GNB: 법령 정보':  () => page.url().includes('/law') });

        await measure(gnbProjectLoad,    () => page.goto(URLS.PROJECT.PROJECT));
        check(page, { 'GNB: 프로젝트':  () => page.url().includes('/project') });

        await measure(gnbDriveLoad,      () => page.goto(URLS.DRIVE.DRIVE));
        check(page, { 'GNB: My 계약서': () => page.url().includes('/drive') });

        await measure(gnbSettingLoad,    () => page.goto(URLS.SETTING.SETUP));
        check(page, { 'GNB: 설정':       () => page.url().includes('/setup') });

    } finally {
        await page.close();
    }
}
