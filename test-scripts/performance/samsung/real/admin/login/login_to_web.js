import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { browser } from 'k6/browser';
import { Trend } from 'k6/metrics';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { buildK6SummaryMessage } from '../../../../common/slack_helper.js';
import { getCredentials, loginWithPage } from './login_helper.js';

// Custom metrics for each login action
export const pageLoadDuration = new Trend('page_load_duration', true);
export const inputCredentialsDuration = new Trend('input_credentials_duration', true);
export const submitLoginDuration = new Trend('submit_login_duration', true);
export const totalLoginDuration = new Trend('total_login_duration', true);

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

    try {
        const metrics = {
            pageLoadDuration,
            inputCredentialsDuration,
            submitLoginDuration,
            totalLoginDuration
        };
        await loginWithPage(page, credentials, metrics);
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
        [`Result/login_to_web_${timestamp}.html`]: htmlReport(data),
    };
    if (metricsFile) {
        output[metricsFile] = JSON.stringify({
            payload: buildK6SummaryMessage(data, 'Login to Web', scriptErrors.length > 0),
            scriptErrors,
        });
    }
    return output;
}