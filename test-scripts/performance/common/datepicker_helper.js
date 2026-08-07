/**
 * Datepicker 공통 헬퍼 (k6 browser)
 * RDP(react-day-picker) 캘린더: [data-slot="calendar"], .rdp-* 클래스
 */

const CALENDAR_SELECTOR = '[data-slot="calendar"]';
const DAY_CELL = 'td[role="gridcell"]:not([data-outside="true"])';
const BTN_PREV = 'button.rdp-button_previous';
const BTN_NEXT = 'button.rdp-button_next';
const CAPTION = '.rdp-caption_label';

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * RDP 캘린더에서 현재 보이는 월의 임의 날짜 선택
 * @param {*} page - k6 page
 * @param {string|object} datepickerSelector - datepicker 트리거 셀렉터 또는 locator
 * @param {object} opts - 옵션
 * @param {string} opts.calendarSelector - 캘린더 컨테이너, 기본 '[data-slot="calendar"]'
 * @param {number} opts.timeout - 대기 타임아웃 (ms)
 * @returns {Promise<string|null>} - 선택된 날짜 (YYYY-MM-DD) 또는 null
 */
export async function selectRandomDateFromRdpCalendar(page, datepickerSelector, opts = {}) {
    const { calendarSelector = CALENDAR_SELECTOR, timeout = 5000 } = opts;

    const trigger = typeof datepickerSelector === 'string' ? page.locator(datepickerSelector) : datepickerSelector;
    await trigger.click();
    await wait(300);

    const calendar = page.locator(calendarSelector);
    await calendar.waitFor({ state: 'visible', timeout });

    const enabledBtns = calendar.locator(`${DAY_CELL} button.rdp-day_button:not([disabled]):not([aria-disabled="true"])`);
    await enabledBtns.first().waitFor({ state: 'visible', timeout: 3000 });
    const count = await enabledBtns.count();
    if (count === 0) return null;

    const idx = Math.floor(Math.random() * count);
    const btn = enabledBtns.nth(idx);
    const dataDay = await btn.getAttribute('data-day');
    await btn.click();
    await wait(200);

    return dataDay || null; // e.g. "2026-03-15"
}

/**
 * RDP 캘린더에서 특정 날짜 선택 (월 이동 포함)
 * @param {*} page - k6 page
 * @param {string|object} datepickerSelector - datepicker 트리거 셀렉터 또는 locator
 * @param {string} targetDate - YYYY-MM-DD 형식
 * @param {object} opts - 옵션
 */
export async function selectDateInRdpCalendar(page, datepickerSelector, targetDate, opts = {}) {
    const { calendarSelector = CALENDAR_SELECTOR, timeout = 5000 } = opts;
    const [y, m] = targetDate.split('-').map(Number);

    const trigger = typeof datepickerSelector === 'string' ? page.locator(datepickerSelector) : datepickerSelector;
    await trigger.click();
    await wait(300);

    const calendar = page.locator(calendarSelector);
    await calendar.waitFor({ state: 'visible', timeout });

    const targetMonth = `${y}년 ${m}월`;
    let captionText = await calendar.locator(CAPTION).textContent();
    let attempts = 0;
    const maxAttempts = 24; // 최대 2년 분 월 이동

    while (captionText !== targetMonth && attempts < maxAttempts) {
        const [currY, currM] = parseCaption(captionText);
        if (!currY || !currM) break;
        if (y > currY || (y === currY && m > currM)) {
            await calendar.locator(BTN_NEXT).click();
        } else {
            await calendar.locator(BTN_PREV).click();
        }
        await wait(200);
        captionText = await calendar.locator(CAPTION).textContent();
        attempts++;
    }

    const dayCell = calendar.locator(`td[role="gridcell"][data-day="${targetDate}"]`);
    await dayCell.waitFor({ state: 'visible', timeout: 2000 });
    await dayCell.locator('button.rdp-day_button').click();
    await wait(200);
}

/**
 * RDP 캘린더에서 기간(시작일~종료일) 선택
 * 시작/종료가 다른 datepicker 트리거 2개인 경우
 * @param {*} page - k6 page
 * @param {string} startTriggerSelector - 시작일 datepicker 트리거
 * @param {string} endTriggerSelector - 종료일 datepicker 트리거
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
export async function selectDateRangeInRdpCalendar(page, startTriggerSelector, endTriggerSelector, startDate, endDate, opts = {}) {
    await selectDateInRdpCalendar(page, startTriggerSelector, startDate, opts);
    await wait(300);
    await selectDateInRdpCalendar(page, endTriggerSelector, endDate, opts);
}

function parseCaption(text) {
    if (!text) return [null, null];
    const match = text.match(/(\d{4})년\s*(\d{1,2})월/);
    return match ? [parseInt(match[1], 10), parseInt(match[2], 10)] : [null, null];
}
