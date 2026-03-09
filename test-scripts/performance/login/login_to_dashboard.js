import { getCurrentLoginCredentials, SELECTORS } from "@tms/performance/url/config.js";
import { URLS } from "@tms/performance/url/url_base.js";
import { getFormattedTimestamp } from "@tms/performance/common/utils.js";

export default async function login_to_dashborad(page) {
    const credentials = getCurrentLoginCredentials();

    await page.goto(URLS.LOGIN.HOME);
    await page.screenshot({ path: `screenshots/screenshot_${getFormattedTimestamp().replace(/:/g, '_')}_home.png` });

    await page.goto(URLS.LOGIN.LOGIN);
    await page.screenshot({ path: `screenshots/screenshot_${getFormattedTimestamp().replace(/:/g, '_')}_login.png` });

    await page.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT);
    await page.type(SELECTORS.LOGIN.EMAIL_INPUT, credentials.EMAIL);

    await page.waitForSelector(SELECTORS.LOGIN.PASSWORD_INPUT);
    await page.type(SELECTORS.LOGIN.PASSWORD_INPUT, credentials.PASSWORD);

    await page.click(SELECTORS.LOGIN.SUBMIT_BUTTON);

    await page.goto(URLS.LOGIN.DASHBOARD);
    await page.screenshot({ path: `screenshots/screenshot_${getFormattedTimestamp().replace(/:/g, '_')}_dashboard.png` });
}

