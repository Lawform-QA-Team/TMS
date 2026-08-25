/**
 * 정규식 PII 필터링 감지 테스트 - autodoc 문서 상세 input 영역 입력 - k6용
 *
 * 각 PII 패턴에 해당하는 샘플 문자열을 문서 input에 입력하여
 * 필터링 감지 알림이 정상 동작하는지 확인한다.
 *
 * 허용된 오탐:
 *  - 주민등록번호: 존재하지 않는 날짜 조합(9011-31, 9002-29 비윤년)은 regex 한계로 허용
 *  - 나이/생년월일: `1살 차이`, `1000살짜리`는 경계 케이스로 허용
 *  - 계좌번호: 전화번호(010-1234-5678) 중복 감지 허용 (기능 동일)
 */
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { browser } from 'k6/browser';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { Trend } from 'k6/metrics';

export const filteringPiiInput = new Trend('filtering_pii_input', true);
export const filteringPageLoad = new Trend('filtering_page_load', true);

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

/** @type {{ name: string, sample: string }[]} */
const PII_SAMPLES = [
    { name: '주민등록번호', sample: '901231-1234567' },
    { name: '운전면허번호', sample: '24-01-012345-67' },
    { name: '전화번호', sample: '010-1234-5678' },
    { name: '이메일', sample: 'user@example.com' },
    { name: '주소', sample: '강남대로 123' },
    { name: '나이/생년월일', sample: '1990년생' },
    { name: '여권번호', sample: 'M12345678' },
    { name: '계좌번호', sample: '110-123-456789' },
    { name: '신용카드번호', sample: '4123-4567-8901-2345' },
    { name: '외국인등록번호', sample: '901231-5234567' },
    { name: '건강보험번호', sample: '2-1234567890' },
];

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function () {
    const context = await browser.newContext({
        viewport: { width: 1960, height: 1080 },
    });
    const page = await context.newPage();
    const credentials = getCredentials();
    const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

    try {
        await loginWithPage(page, credentials);

        // autodoc 표준 양식 목록 진입
        const filteringPageLoadStart = Date.now();
        await page.goto(URLS.AUTODOC.STANDARD);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX.png` });
        filteringPageLoad.add(Date.now() - filteringPageLoadStart);

        // 문서 검색
        await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
        await page.type(SELECTORS.WEB.AUTODOC.INPUT_SEARCH, '개인정보처리위탁계약서_삼성');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX_search.png` });

        await wait(1000);

        // 문서 상세 진입
        await page.goto(URLS.AUTODOC.DETAIL + '7');
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX_doc_detail.png` });

        // PII 샘플 데이터 입력 및 필터링 감지 확인
        const filteringPiiInputStart = Date.now();
        const docInputSelector = '[role="textbox"]';
        await page.waitForSelector(docInputSelector);

        for (const pii of PII_SAMPLES) {
            await page.fill(docInputSelector, pii.sample);
            await wait(1000);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX_input_${pii.name}.png` });
            await page.fill(docInputSelector, '');
        }

        // 복합 감지 확인
        const combinedSample = PII_SAMPLES.map(p => p.sample).join(' / ');
        await page.fill(docInputSelector, combinedSample);
        await wait(1000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX_input_combined.png` });
        filteringPiiInput.add(Date.now() - filteringPiiInputStart);

        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
        await page.waitForSelector('button:has-text("확인")');
        await page.click('button:has-text("확인")');

        // Drive 진입 후 기존 문서 편집 모드 PII 입력
        await page.goto(URLS.DRIVE.DRIVE);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX_drive.png` });

        await page.waitForSelector(SELECTORS.WEB.DRIVE.TABLE_LIST);
        await page.click(`${SELECTORS.COMMON.TABLE} span.cursor-pointer`);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_table.png` });

        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_EDITOR_EDIT_MODE);
        await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_EDITOR_EDIT_MODE);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit.png` });

        await page.waitForSelector('[contenteditable="true"]');
        const editInputSelector = '[contenteditable="true"]';

        for (const pii of PII_SAMPLES) {
            await page.fill(editInputSelector, pii.sample);
            await wait(1000);
            timestamp = getNewTimeStamp();
            await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_input_${pii.name}.png` });
            await page.fill(editInputSelector, '');
        }

        await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
        await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
        await page.waitForSelector('button:has-text("확인")');
        await page.click('button:has-text("확인")');

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
    return {
        [`Result/web_filtering_regex_${timestamp}.html`]: htmlReport(data),
    };
}
