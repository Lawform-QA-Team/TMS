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

const AUTH_MODES = {
    SSO_UI: 'sso_ui',
    PREAUTH: 'preauth',
    DIRECT: 'direct',
};

const DEFAULT_LOGIN_TIMEOUT_MS = 60000;

function getEnvValue(key, fallback = null) {
    if (typeof __ENV !== 'undefined' && __ENV[key]) {
        return __ENV[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    return fallback;
}

function getLoginTimeout() {
    const timeout = Number(getEnvValue('LOGIN_TIMEOUT_MS', DEFAULT_LOGIN_TIMEOUT_MS));
    return Number.isFinite(timeout) ? timeout : DEFAULT_LOGIN_TIMEOUT_MS;
}

function getAuthMode() {
    const mode = String(getEnvValue('AUTH_MODE', AUTH_MODES.DIRECT)).toLowerCase();
    if (mode === AUTH_MODES.SSO_UI || mode === AUTH_MODES.PREAUTH || mode === AUTH_MODES.DIRECT) {
        return mode;
    }
    throw new Error(`지원하지 않는 AUTH_MODE입니다: ${mode}`);
}

function getSelector(envKey, fallback) {
    return getEnvValue(envKey, fallback);
}

function getCredentials(prefix = '') {
    const envPrefix = prefix ? `${prefix}_` : '';
    const email = getEnvValue(`${envPrefix}LOGIN_EMAIL`, getEnvValue('LOGIN_EMAIL', 'test@hsad.co.kr'));
    const password = getEnvValue(`${envPrefix}LOGIN_PASSWORD`, getEnvValue('LOGIN_PASSWORD', 'password'));
    return { EMAIL: email, PASSWORD: password };
}

async function waitForServiceUrl(page, URLS) {
    await page.waitForURL(URLS.LOGIN.CALLBACK_WAIT || URLS.LOGIN.DASHBOARD, { timeout: getLoginTimeout() });
}

async function waitForInternalReady(page, SELECTORS) {
    const serviceSelectors = SELECTORS.LOGIN.SERVICE || SELECTORS.LOGIN;
    const readySelector = getSelector('SERVICE_READY_SELECTOR', serviceSelectors.READY || '[data-tid]');
    await page.waitForSelector(readySelector, { timeout: getLoginTimeout() });
}

async function waitForServiceReady(page, URLS, SELECTORS) {
    await waitForServiceUrl(page, URLS);
    await waitForInternalReady(page, SELECTORS);
}

async function loginWithDirectForm(page, URLS, SELECTORS) {
    const serviceSelectors = SELECTORS.LOGIN.SERVICE || SELECTORS.LOGIN;
    const credentials = getCredentials();
    await page.goto(URLS.LOGIN.LOGIN);
    console.log('login url:', URLS.LOGIN.LOGIN);
    await page.locator(getSelector('LOGIN_EMAIL_SELECTOR', serviceSelectors.EMAIL_INPUT)).fill(credentials.EMAIL);
    await page.locator(getSelector('LOGIN_PASSWORD_SELECTOR', serviceSelectors.PASSWORD_INPUT)).fill(credentials.PASSWORD);
    await Promise.all([
        waitForServiceUrl(page, URLS),
        page.locator(getSelector('LOGIN_SUBMIT_SELECTOR', serviceSelectors.SUBMIT_BUTTON)).click(),
    ]);
    await waitForInternalReady(page, SELECTORS);
}

async function loginWithCustomerSso(page, URLS, SELECTORS) {
    const ssoSelectors = SELECTORS.LOGIN.CUSTOMER_SSO;
    const credentials = getCredentials('SSO');
    const entryUrl = URLS.LOGIN.SSO_ENTRY || URLS.LOGIN.LOGIN;
    await page.goto(entryUrl);
    console.log('sso entry url:', entryUrl);

    const startButtonSelector = getSelector('SSO_START_BUTTON_SELECTOR', null);
    if (startButtonSelector) {
        await page.locator(startButtonSelector).click();
    }

    await page.locator(getSelector('SSO_EMAIL_SELECTOR', ssoSelectors.EMAIL_INPUT)).fill(credentials.EMAIL);
    await page.locator(getSelector('SSO_PASSWORD_SELECTOR', ssoSelectors.PASSWORD_INPUT)).fill(credentials.PASSWORD);
    await Promise.all([
        waitForServiceUrl(page, URLS),
        page.locator(getSelector('SSO_SUBMIT_SELECTOR', ssoSelectors.SUBMIT_BUTTON)).click(),
    ]);
    await waitForInternalReady(page, SELECTORS);
}

async function loginWithPreAuth(page, URLS, SELECTORS) {
    const entryUrl = URLS.LOGIN.SSO_ENTRY || URLS.LOGIN.DASHBOARD;
    await page.goto(entryUrl);
    console.log('preauth entry url:', entryUrl);
    await waitForServiceReady(page, URLS, SELECTORS);
}

export async function loginToDashboard(page, URLS, SELECTORS) {
    const authMode = getAuthMode();
    if (authMode === AUTH_MODES.SSO_UI) {
        await loginWithCustomerSso(page, URLS, SELECTORS);
        return;
    }
    if (authMode === AUTH_MODES.PREAUTH) {
        await loginWithPreAuth(page, URLS, SELECTORS);
        return;
    }
    await loginWithDirectForm(page, URLS, SELECTORS);
}

export async function measure(metric, action) {
    const start = Date.now();
    const result = await action();
    const duration = Date.now() - start;
    metric.add(duration);
    return result;
}
