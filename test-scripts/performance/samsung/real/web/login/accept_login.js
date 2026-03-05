/*
    최초 로그인 시도 시 개인정보 처리 방침 동의 절차
*/

import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { browser } from "k6/browser"
import { getFormattedTimestamp } from "../../../../common/utils.js"
import { getCredentials, loginWithPage } from "./login_helper.js"
import { SELECTORS } from "../../selector_sam.js"
import { URLS } from "../../url_base_sam.js"

export const options = {
    scenarios: {
        ui: {
            executor: "shared-iterations",
            vus: 1,
            iterations: 1,
        }
    },
    thresholds: {
        checks: ['rate==1.0'],
    },
}

export default async function() {
    const page = await browser.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);
        await page.waitForSelector();
        await page.click();
    } finally {
        await page.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
    return {
        [`Result/accept_login_${timestamp}.html`]: htmlReport(data),
    };
}