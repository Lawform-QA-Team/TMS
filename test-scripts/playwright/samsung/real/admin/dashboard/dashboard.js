/**
 * 대시보드(통계) - Playwright용
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';
import { selectComboboxOption } from '../../../../common/combobox_helper.js';
import {
  selectRandomDateFromRdpCalendar,
  selectDateInRdpCalendar,
} from '../../../../common/datepicker_helper.js';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomDate(daysBack = 365) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString().slice(0, 10);
}

async function selectDateRangeInRdp(page, startDate, endDate) {
  const wrap = SELECTORS.ADMIN.DASHBOARD.DATEPICKER;
  const inputCount = await page.locator(`${wrap} input`).count();
  if (inputCount >= 2) {
    await selectDateInRdpCalendar(page, page.locator(`${wrap} input`).first(), startDate);
    await wait(300);
    await selectDateInRdpCalendar(page, page.locator(`${wrap} input`).nth(1), endDate);
  } else {
    await selectRandomDateFromRdpCalendar(page, wrap);
  }
}

async function selectMonthInPicker(page, year, month) {
  await page.locator(SELECTORS.ADMIN.DASHBOARD.DATEPICKER).click();
  await wait(300);
  const yearInput = page.locator('input[type="number"], input[placeholder*="년"]').first();
  if (await yearInput.isVisible().catch(() => false)) {
    await yearInput.fill(String(year));
    await wait(200);
  }
  const monthLabel = `${month}월`;
  await page.getByText(monthLabel, { exact: true }).click();
  await wait(200);
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
  const credentials = getCredentials();
  const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

  await loginWithPage(page, credentials);

  await page.goto(URLS.LOGIN.DASHBOARD);
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_dashboard_home.png` });

  await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.EXCEL);
  await page.click(SELECTORS.ADMIN.DASHBOARD.EXCEL);
  await wait(2000);
  await page.screenshot({ path: `screenshots/${timestamp}_excel_download.png` });

  await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_CATEGORY);
  await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_CATEGORY);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_select_gategory.png` });

  await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_DATA_SELECT);
  await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_DATA_SELECT);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_select_gategory2.png` });

  await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT);
  const randomValue3 = await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT);
  console.log('randomValue3 (조회 단위)', randomValue3);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_select_gategory3.png` });
  await wait(2000);

  const queryUnit = (randomValue3 || '').trim();
  if (queryUnit.includes('일')) {
    await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.DATEPICKER);
    const startDate = getRandomDate(365);
    const end = new Date(startDate);
    end.setDate(end.getDate() + 7);
    const endDate = end.toISOString().slice(0, 10);
    await selectDateRangeInRdp(page, startDate, endDate);
  } else if (queryUnit.includes('월')) {
    await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.DATEPICKER);
    const d = new Date();
    d.setMonth(d.getMonth() - Math.floor(Math.random() * 12));
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    await selectMonthInPicker(page, y, m);
  } else if (queryUnit.includes('분기')) {
    await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT);
    await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT);
    await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
    await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
  } else if (queryUnit.includes('반기')) {
    await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT);
    await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT);
    await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
    await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
  } else if (queryUnit.includes('년도') || queryUnit.includes('연')) {
    await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
    await selectComboboxOption(page, SELECTORS.ADMIN.DASHBOARD.SELECT_QUERY_UNIT_1);
  }

  await page.waitForSelector(SELECTORS.ADMIN.DASHBOARD.BUTTON_SEARCH);
  await page.click(SELECTORS.ADMIN.DASHBOARD.BUTTON_SEARCH);
}
