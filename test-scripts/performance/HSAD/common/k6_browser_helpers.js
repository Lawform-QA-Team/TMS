export const hsadBrowserOptions = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            options: {
                browser: {
                    type: 'chromium',
                    defaultViewport: {
                        width: 2560,
                        height: 1440,
                    },
                },
            },
        },
    },
    thresholds: {
        checks: ['rate==1.0'],
    },
};

export async function loginToDashboard(page, URLS, SELECTORS) {
    await page.goto(URLS.LOGIN.LOGIN);
    await page.locator(SELECTORS.LOGIN.EMAIL_INPUT).type(__ENV.LOGIN_EMAIL || 'test@hsad.co.kr');
    await page.locator(SELECTORS.LOGIN.PASSWORD_INPUT).type(__ENV.LOGIN_PASSWORD || 'password');
    await Promise.all([
        page.waitForURL(URLS.LOGIN.DASHBOARD),
        page.locator(SELECTORS.LOGIN.SUBMIT_BUTTON).click(),
    ]);
}

export async function measure(metric, action) {
    const start = Date.now();
    const result = await action();
    const duration = Date.now() - start;
    metric.add(duration);
    return result;
}
