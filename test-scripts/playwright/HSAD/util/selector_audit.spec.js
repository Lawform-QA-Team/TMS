/**
 * Selector Audit - HSAD 전체 selector 존재 여부 자동 검증
 *
 * 목적: selector_hsad.js에 정의된 selector가 실제 페이지에서 찾아지는지 사전 검토
 *       spec 파일이나 시나리오를 실행하지 않고, selector 유효성만 빠르게 확인
 *
 * 실행:
 *   npx playwright test util/selector_audit.spec.js --reporter=list
 *
 * 결과:
 *   - 콘솔: 그룹별 FOUND / NOT_FOUND / INVALID 요약
 *   - 파일: selector-audit-report.json (프로젝트 루트에 저장)
 *
 * NOT_FOUND 해석:
 *   - 해당 URL 진입 시 DOM에 없는 selector
 *   - 다른 페이지/모달에 있는 selector이면 정상
 *   - 페이지 구조 변경으로 제거/변경된 selector이면 수정 필요
 */
import { test } from '@playwright/test';
import { SELECTORS } from './selector_hsad.js';
import { URLS } from './url_base_hsad.js';
import { login } from '../common/auth.js';
import fs from 'fs';
import path from 'path';

// ─── 그룹별 대표 URL 매핑 ─────────────────────────────────────────────────────
// 해당 URL 진입 후 그룹 selector 전체를 스캔
// 참고: 상세/모달 전용 selector는 URL 진입 시 NOT_FOUND로 나타나는 것이 정상
const AUDIT_MAP = [
    { label: 'Dashboard',        url: () => URLS.LOGIN.DASHBOARD,    selectors: SELECTORS.BUSINESS.DASHBOARD },
    { label: 'CLM',              url: () => URLS.CLM.DRAFT,          selectors: SELECTORS.BUSINESS.CLM },
    { label: 'Advice',           url: () => URLS.ADVICE.DRAFT,       selectors: SELECTORS.BUSINESS.ADVICE },
    { label: 'Litigation',       url: () => URLS.LITIGATION.REVIEW,  selectors: SELECTORS.BUSINESS.LITIGATION },
    { label: 'Seal',             url: () => URLS.SEAL.DRAFT,         selectors: SELECTORS.BUSINESS.SEAL },
    { label: 'Project',          url: () => URLS.PROJECT.PROJECT,    selectors: SELECTORS.BUSINESS.PROJECT },
    { label: 'Teams',            url: () => URLS.SETTING.TEAM,       selectors: SELECTORS.BUSINESS.TEAMS },
    { label: 'Setup',            url: () => URLS.SETTING.SETUP,      selectors: SELECTORS.BUSINESS.SETUP },
    { label: 'Law',              url: () => URLS.LAW.SCHEDULE,       selectors: SELECTORS.BUSINESS.LAW },
    { label: 'Bulk',             url: () => URLS.BULK.BULK,          selectors: SELECTORS.BUSINESS.BULK },
    { label: 'Drive',            url: () => URLS.DRIVE.DRIVE,        selectors: SELECTORS.BUSINESS.DRIVE },
    { label: 'Template',         url: () => URLS.CONTRACT.STAMP,     selectors: SELECTORS.BUSINESS.TEMPLATE },
    { label: 'Log',              url: () => URLS.SETTING.LOG,        selectors: SELECTORS.BUSINESS.LOG },
    { label: 'DocumentCompare',  url: () => URLS.CLM.COMPARE,       selectors: SELECTORS.BUSINESS.DOCUMENT_COMPARE },
    { label: 'Inquiry',          url: () => URLS.LOGIN.DASHBOARD,    selectors: SELECTORS.BUSINESS.INQUIRY },
    { label: 'Statistics',       url: () => URLS.STATISTICS.STATISTICS, selectors: SELECTORS.BUSINESS.STATISTICS },
];

// ─── selector 평탄화 ──────────────────────────────────────────────────────────
// 중첩 객체를 "KEY.SUBKEY" 형태로 평탄화하여 스캔 대상 목록 생성
function flattenSelectors(obj, prefix = '') {
    const result = [];
    for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'string') {
            result.push({ name: fullKey, selector: val });
        } else if (val && typeof val === 'object') {
            result.push(...flattenSelectors(val, fullKey));
        }
    }
    return result;
}

// ─── 리포트 수집 ──────────────────────────────────────────────────────────────
const auditReport = {};

// ─── 그룹별 audit test ────────────────────────────────────────────────────────
for (const { label, url: getUrl, selectors } of AUDIT_MAP) {
    if (!selectors) continue;

    const flatList = flattenSelectors(selectors);
    if (flatList.length === 0) continue;

    test(`[Audit] ${label} (${flatList.length}개)`, async ({ page }) => {
        await login(page);

        const url = getUrl();
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        const results = [];

        for (const { name, selector } of flatList) {
            let count = 0;
            let status = 'NOT_FOUND';
            try {
                count = await page.locator(selector).count();
                status = count > 0 ? 'FOUND' : 'NOT_FOUND';
            } catch (_) {
                status = 'INVALID'; // XPath 오류 등 잘못된 selector
            }

            results.push({ name, selector, count, status });
        }

        // 통계
        const found    = results.filter(r => r.status === 'FOUND').length;
        const notFound = results.filter(r => r.status === 'NOT_FOUND').length;
        const invalid  = results.filter(r => r.status === 'INVALID').length;

        // 콘솔 요약
        console.log(`\n[${label}] 총 ${flatList.length}개`);
        console.log(`  FOUND: ${found} | NOT_FOUND: ${notFound} | INVALID: ${invalid}`);

        if (invalid > 0) {
            console.log('  ⚠ INVALID (selector 문법 오류):');
            results.filter(r => r.status === 'INVALID').forEach(r => {
                console.log(`    - ${r.name}: ${r.selector}`);
            });
        }
        if (notFound > 0) {
            console.log('  NOT_FOUND (이 페이지에서 미노출 — 다른 페이지/모달이면 정상):');
            results.filter(r => r.status === 'NOT_FOUND').forEach(r => {
                console.log(`    - ${r.name}: ${r.selector}`);
            });
        }

        auditReport[label] = { url, total: flatList.length, found, notFound, invalid, results };
    });
}

// ─── 전체 리포트 파일 저장 ────────────────────────────────────────────────────
test.afterAll(async () => {
    const reportPath = path.join(process.cwd(), 'selector-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2), 'utf-8');

    // 전체 요약
    let totalFound = 0, totalNotFound = 0, totalInvalid = 0;
    for (const { found, notFound, invalid } of Object.values(auditReport)) {
        totalFound    += found    ?? 0;
        totalNotFound += notFound ?? 0;
        totalInvalid  += invalid  ?? 0;
    }

    console.log('\n════════════════════════════════');
    console.log('Selector Audit 전체 요약');
    console.log(`  FOUND:     ${totalFound}`);
    console.log(`  NOT_FOUND: ${totalNotFound}`);
    console.log(`  INVALID:   ${totalInvalid}`);
    console.log(`  리포트:    ${reportPath}`);
    console.log('════════════════════════════════');
});
