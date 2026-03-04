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

export default async function() {
    const page = await browser.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);

        // 표준 양식 관리 등록 진입
        await page.goto(URLS.AUTODOC.NEW + "1");
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL.png` });
        await wait(5000);
        
        // 본문 제목
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.INPUT);
        await page.type(SELECTORS.ADMIN.AUTODOC_TOOL.INPUT, '표준 양식 테스트');
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_input.png` });

        // 최상단 인풋 섹션 추가
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_TOP_INPUT_SECTION);
        await page.click(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_TOP_INPUT_SECTION);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_add_input_section.png` });

        // 섹션 추가
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_SECTION);
        await page.click(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_ADD_SECTION);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_add_section.png` });

        // 섹션 추가
        await page.waitForSelector(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_REMOVE_SECTION);
        await page.click(SELECTORS.ADMIN.AUTODOC_TOOL.BUTTON_REMOVE_SECTION);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_TOOL_remove_section.png` });
        
    } finally {
        await page.close();
    }
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
    return {
        [`Result/notice_${timestamp}.html`]: htmlReport(data),
    };
}