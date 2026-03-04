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

        // 사용자 관리 - 백오피스
        await page.goto(URLS.MEMBER.BACKOFFICE);
        let timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE.png` });
        await wait(5000);

        // 사용자 관리 - 백오피스, 페이지네이션
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_pagination_last.png` });
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 사용자 관리 - 백오피스, 검색
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH, 'a');
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_search.png` });

        // 사용자 관리 - 백오피스, 테이블 클릭
        await page.goto(URLS.MEMBER.BACKOFFICE);
        await page.waitForSelector(SELECTORS.COMMON.TABLE);
        await page.click(`${SELECTORS.COMMON.TABLE} button`);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_BACKOFFICE_table.png` });

        // 사용자 관리 - 서비스
        await page.goto(URLS.MEMBER.SERVICE);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE.png` });
        await wait(5000);

        // 사용자 관리 - 서비스, 페이지네이션
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_pagination_last.png` });
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 사용자 관리 - 서비스, 검색
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH);
        await page.type(SELECTORS.ADMIN.MEMBERS_TABLE.INPUT_SEARCH, 'a');
        await selectComboboxOption(page, SELECTORS.ADMIN.MEMBERS_TABLE.SELECT_ROLE)
        await selectComboboxOption(page, SELECTORS.ADMIN.MEMBERS_TABLE.SELECT_APPROVAL_STATUS)
        await page.waitForSelector(SELECTORS.COMMON.SEARCH);
        await page.click(SELECTORS.COMMON.SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_search.png` });

        // 사용자 관리 - 서비스, 테이블 클릭
        await page.goto(URLS.MEMBER.SERVICE);
        await page.waitForSelector(SELECTORS.COMMON.TABLE);
        await page.click(`${SELECTORS.COMMON.TABLE} button`);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_table.png` });

        // 사용자 관리 - 서비스, 인수인계 진입
        await page.goto(URLS.MEMBER.SERVICE);
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.BUTTON_HANDOVER_CLICK);
        await page.click(SELECTORS.ADMIN.MEMBERS_TABLE.BUTTON_HANDOVER_CLICK);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover.png` });
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_GO_TO_LIST);
        await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_GO_TO_LIST);

        // 사용자 관리 - 서비스, 인수인계 인계자 진입
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS_TABLE.BUTTON_HANDOVER_CLICK);
        await page.click(SELECTORS.ADMIN.MEMBERS_TABLE.BUTTON_HANDOVER_CLICK);
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEROR);
        await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEROR);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferor.png` });

        // 사용자 관리 - 서비스, 인수인계 인계자 페이지네이션
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferor_pagination_last.png` });
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 사용자 관리 - 서비스, 인수인계 인계자 검색
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.INPUT);
        await page.type(SELECTORS.ADMIN.USER_SELECT_MODAL.INPUT, 'a');
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_SEARCH);
        await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferor_search.png` });
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CLOSE);

        // 사용자 관리 - 서비스, 인수인계 인계자 테이블 클릭
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEROR);
        await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEROR);
        await page.waitForSelector(SELECTORS.COMMON.TABLE);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferor_table.png` });

        // 사용자 관리 - 서비스, 인수인계 인계자 선택
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CONFIRM);
        await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CONFIRM);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferor_submit.png` });



        // 사용자 관리 - 서비스, 인수인계 인수자 진입
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEREE);
        await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEREE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferee.png` });

        // 사용자 관리 - 서비스, 인수인계 인수자 페이지네이션
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_LAST);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferee_pagination_last.png` });
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.PAGINATION);
        await page.click(SELECTORS.COMMON.PAGE_FIRST);

        // 사용자 관리 - 서비스, 인수인계 인수자 검색
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.INPUT);
        await page.type(SELECTORS.ADMIN.USER_SELECT_MODAL.INPUT, 'a');
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_SEARCH);
        await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_SEARCH);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferee_search.png` });
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CLOSE);
        await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CLOSE);

        // 사용자 관리 - 서비스, 인수인계 인수자 테이블 클릭
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEREE);
        await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_SELECT_TRANSFEREE);
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.INPUT);
        await page.type(SELECTORS.ADMIN.USER_SELECT_MODAL.INPUT, 'ggp');
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_SEARCH);
        await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_SEARCH);
        await page.waitForSelector(SELECTORS.COMMON.TABLE);
        await page.click(SELECTORS.COMMON.TABLE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferee_table.png` });

        // 사용자 관리 - 서비스, 인수인계 인수자 선택
        await page.waitForSelector(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CONFIRM);
        await page.click(SELECTORS.ADMIN.USER_SELECT_MODAL.BUTTON_CONFIRM);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_transferee_submit.png` });

        // 사용자 관리 - 서비스, 인수인계 저장
        await page.waitForSelector(SELECTORS.ADMIN.MEMBERS.BUTTON_SAVE);
        await page.click(SELECTORS.ADMIN.MEMBERS.BUTTON_SAVE);
        await wait(5000);
        timestamp = getNewTimeStamp();
        await page.screenshot({ path: `screenshots/${timestamp}_MEMBER_SERVICE_handover_submit.png` });

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