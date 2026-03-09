import { URLS, SELECTORS } from '@playwright/Base_Code/business/URL/url_base.js';
import { getFormattedTimestamp } from '@playwright/Base_Code/business/common/utils.js';

export default async function login_to_web(page, options = {}) {
    const getFromattedTimestamp = () => getFormattedTimestamp().replace(/:/g, '_');
    let timestamp = getFromattedTimestamp();

    try {
        await page.goto(URLS.LOGIN.HOME);
        timestamp = getFromattedTimestamp();
        console.log('login_to_web page:', await page.url());
        await page.screenshot({path: `screenshots/${timestamp}_login.png`});

        await page.waitForSelector(SELECTORS.LOGIN.EMAIL_INPUT)
    }
    catch (error){
        console.error('login_to_web error:', error);
        throw error;
    }
    finally {
        console.log('login_to_web success'); 
    }
}