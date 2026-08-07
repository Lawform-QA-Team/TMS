/**
 * HSAD 마이그레이션 - 체결 계약서 별도 등록 본 확인
 *
 * 플로우:
 *   1. 체결 계약서 리스트(/clm/complete)로 이동
 *   2. 각 행 클릭 → 상세 스크린샷 + 정보 수집
 *   3. 목록으로 복귀 → 다음 항목
 *   4. 페이지네이션 순환 (마지막 페이지까지)
 *
 * 결과물:
 *   - screenshots/migrate/  : 리스트 및 상세 스크린샷
 *   - data/migrate/*.json   : 수집된 상세 정보 (전체)
 *   - data/migrate/*.csv    : 수집된 상세 정보 (표 형식)
 */
import fs from 'fs';
import path from 'path';
import { URLS } from '../util/url_base_hsad.js';
import { SELECTORS } from '../util/selector_hsad.js';
import { getFileSafeTimestamp, wait } from '../util/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

const CLM = SELECTORS.BUSINESS.CLM;

const SCREENSHOT_DIR = 'screenshots/migrate';
const DATA_DIR = 'data/migrate';

// 체결 계약서 리스트 행 셀렉터 (cursor-pointer 클래스가 있는 tr)
const ROW_SELECTOR = '//tr[contains(@class,"cursor-pointer")]';

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function ensureDirs() {
    [SCREENSHOT_DIR, DATA_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
}

function appendCsvRow(filePath, record) {
    const line = Object.values(record)
        .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',') + '\n';
    fs.appendFileSync(filePath, line, 'utf8');
}

// ─── 페이지 데이터 추출 ────────────────────────────────────────────────────────

/**
 * 체결 계약서 상세 페이지에서 핵심 정보 추출
 * 실제 DOM 구조에 맞게 셀렉터를 조정하세요.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Object>}
 */
async function extractDetailInfo(page) {
    const url = page.url();

    const fields = await page.evaluate(() => {
        const getText = (selector) => {
            const el = document.querySelector(selector);
            return el ? el.textContent.trim() : '';
        };

        // 주요 필드 — 실제 data-tid 또는 CSS 클래스로 조정 필요
        const result = {
            contract_name: getText('[data-tid="3116ad1c"], [data-tid="5b2d6d29"]'),
        };

        // 라벨-값 쌍 일괄 수집 (dt/dd, 혹은 grid 레이아웃의 label-value 패턴)
        document.querySelectorAll('dt').forEach(dt => {
            const key = dt.textContent.trim();
            const dd = dt.nextElementSibling;
            if (key && dd) result[key] = dd.textContent.trim();
        });

        return result;
    });

    return { url, ...fields };
}

// ─── 페이지네이션 ──────────────────────────────────────────────────────────────

/**
 * 페이지네이션 컴포넌트에서 전체 페이지 수 반환
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<number>}
 */
async function getTotalPages(page) {
    const pagination = page.locator(CLM.PAGINATION);
    if (await pagination.count() === 0) return 1;

    // 숫자만 있는 버튼들 중 마지막 값 = 마지막 페이지 번호
    const pageButtons = pagination.locator('button').filter({ hasNotText: /[<>←→«»]/ });
    const count = await pageButtons.count();
    if (count === 0) return 1;

    const lastText = (await pageButtons.last().textContent()).trim();
    const lastPage = parseInt(lastText, 10);
    return isNaN(lastPage) ? 1 : lastPage;
}

/**
 * 다음 페이지로 이동
 * @param {import('@playwright/test').Page} page
 * @param {number} targetPage
 */
async function goToPage(page, targetPage) {
    const pagination = page.locator(CLM.PAGINATION);

    // 1순위: 해당 페이지 번호 버튼 직접 클릭
    const pageBtn = pagination.locator(`button:text-is("${targetPage}")`);
    if (await pageBtn.count() > 0) {
        await pageBtn.first().click();
        return;
    }

    // 2순위: 페이지 번호가 안 보이면(페이지 그룹 이동) 마지막 버튼(다음 >) 클릭
    const allBtns = pagination.locator('button');
    const btnCount = await allBtns.count();
    if (btnCount > 0) {
        await allBtns.last().click();
    }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    ensureDirs();

    const credentials = getCredentials();
    await loginWithPage(page, credentials);

    const runTs = getFileSafeTimestamp();
    const jsonPath = path.join(DATA_DIR, `migrate_${runTs}.json`);
    const csvPath = path.join(DATA_DIR, `migrate_${runTs}.csv`);

    const allData = [];
    let globalIndex = 0;
    let csvHeaderWritten = false;

    // 1. 체결 계약서 리스트 이동
    await page.goto(URLS.CLM.COMPLETE);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector(ROW_SELECTOR);

    const totalPages = await getTotalPages(page);
    console.log(`체결 계약서 마이그레이션 확인 시작 — 총 ${totalPages}페이지`);

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        console.log(`\n[페이지 ${currentPage}/${totalPages}]`);

        // 리스트 스크린샷
        const listTs = getFileSafeTimestamp();
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `${listTs}_list_p${currentPage}.png`)
        });

        // 현재 페이지 행 수 확인 (최대 10개)
        const rowCount = await page.locator(ROW_SELECTOR).count();
        console.log(`  ${rowCount}개 항목 발견`);

        // 2~3. 각 행 순회 → 상세 진입 → 스크린샷 + 정보 수집 → 복귀
        for (let i = 0; i < rowCount; i++) {
            globalIndex++;
            console.log(`  [${globalIndex}] ${currentPage}p / ${i + 1}번째 항목`);

            // 행 클릭 (DOM 재렌더링 대응을 위해 매번 재조회)
            await page.locator(ROW_SELECTOR).nth(i).click();
            await page.waitForLoadState('networkidle');
            await wait(300);

            // 상세 스크린샷 (전체 페이지)
            const detailTs = getFileSafeTimestamp();
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, `${detailTs}_detail_p${currentPage}_r${i + 1}.png`),
                fullPage: true,
            });

            // 상세 정보 수집
            const info = await extractDetailInfo(page);
            const record = {
                index: globalIndex,
                page: currentPage,
                row: i + 1,
                captured_at: detailTs,
                ...info,
            };
            allData.push(record);

            // CSV 헤더 (첫 레코드의 키 기준)
            if (!csvHeaderWritten) {
                const header = Object.keys(record).map(k => `"${k}"`).join(',') + '\n';
                fs.writeFileSync(csvPath, header, 'utf8');
                csvHeaderWritten = true;
            }
            appendCsvRow(csvPath, record);

            // 목록으로 복귀
            const listLink = page.locator(CLM.LIST_LINK).first();
            const listBtn = page.locator(CLM.LIST_BUTTON).first();

            if (await listLink.isVisible({ timeout: 2000 }).catch(() => false)) {
                await listLink.click();
            } else if (await listBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await listBtn.click();
            } else {
                await page.goBack();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForSelector(ROW_SELECTOR);
        }

        // 4. 다음 페이지로 이동 (마지막 페이지면 종료)
        if (currentPage < totalPages) {
            await goToPage(page, currentPage + 1);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector(ROW_SELECTOR);
        }
    }

    // 결과 저장
    fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2), 'utf8');

    console.log(`\n완료: 총 ${globalIndex}개 계약서 확인`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  CSV : ${csvPath}`);
}
