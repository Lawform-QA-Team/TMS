/**
 * Selector Audit - 브라우저 콘솔 스크립트
 *
 * 사용법:
 *   1. 확인하고 싶은 페이지를 브라우저로 열기 (로그인 후)
 *   2. F12 → Console 탭
 *   3. 이 파일 내용 전체를 복사해서 붙여넣기 → Enter
 *
 * 결과:
 *   - 현재 페이지에 존재하는 data-tid 요소 전체 목록 (테이블)
 *   - auditSelector() 함수로 특정 selector 즉시 테스트 가능
 *   - auditCopy() 함수로 결과를 클립보드에 복사 가능
 */
(function selectorAudit() {
    const url = location.href;

    // ─── 1. 현재 페이지 data-tid 역스캔 ─────────────────────────────────────
    const tidElements = [...document.querySelectorAll('[data-tid]')];

    const tidReport = tidElements.map(el => {
        const tid = el.getAttribute('data-tid');
        const rect = el.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
        return {
            selector: `[data-tid="${tid}"]`,
            tag: el.tagName.toLowerCase(),
            text: (el.innerText || el.value || el.placeholder || '').trim().slice(0, 50),
            visible: isVisible ? '✅' : '❌(hidden)',
        };
    });

    // ─── 2. 출력 ──────────────────────────────────────────────────────────────
    console.group(
        `%c[Selector Audit] ${url}`,
        'color:#0066cc; font-weight:bold; font-size:13px'
    );
    console.log(`data-tid 요소: %c${tidReport.length}개`, 'font-weight:bold');

    if (tidReport.length === 0) {
        console.warn('data-tid 요소가 없습니다. 로그인 후 서비스 페이지에서 실행하세요.');
    } else {
        console.table(tidReport);
    }

    // ─── 3. 헬퍼 함수 등록 ───────────────────────────────────────────────────

    /**
     * 특정 selector가 현재 페이지에 있는지 즉시 확인
     * @example
     *   auditSelector('[data-tid="180e8fb0"]')
     *   auditSelector('//button[text()="신규 자문 요청"]')
     */
    window.auditSelector = function (selector) {
        try {
            let count;
            if (selector.startsWith('//') || selector.startsWith('(//')) {
                const r = document.evaluate(
                    selector, document, null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
                );
                count = r.snapshotLength;
            } else {
                count = document.querySelectorAll(selector).length;
            }
            if (count > 0) {
                console.log(`%c✅ FOUND (${count}개)%c  ${selector}`, 'color:green;font-weight:bold', 'color:inherit');
            } else {
                console.warn(`❌ NOT FOUND  ${selector}`);
            }
            return count;
        } catch (e) {
            console.error(`⚠ INVALID selector  ${selector}`, e.message);
            return -1;
        }
    };

    /**
     * 여러 selector를 한꺼번에 검증
     * @example
     *   auditSelectors({
     *     NEW_BUTTON: '[data-tid="180e8fb0"]',
     *     SAVE: '[data-tid="69c770b9"]',
     *   })
     */
    window.auditSelectors = function (selectorMap) {
        const results = [];
        for (const [name, selector] of Object.entries(selectorMap)) {
            let count = 0, status = 'NOT_FOUND';
            try {
                if (selector.startsWith('//') || selector.startsWith('(//')) {
                    const r = document.evaluate(
                        selector, document, null,
                        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
                    );
                    count = r.snapshotLength;
                } else {
                    count = document.querySelectorAll(selector).length;
                }
                status = count > 0 ? 'FOUND' : 'NOT_FOUND';
            } catch (_) {
                status = 'INVALID';
            }
            results.push({ name, selector, count, status });
        }
        const found    = results.filter(r => r.status === 'FOUND').length;
        const notFound = results.filter(r => r.status === 'NOT_FOUND').length;
        const invalid  = results.filter(r => r.status === 'INVALID').length;
        console.log(`FOUND: ${found} | NOT_FOUND: ${notFound} | INVALID: ${invalid}`);
        console.table(results);
        return results;
    };

    /**
     * 스캔 결과를 JSON으로 클립보드 복사
     */
    window.auditCopy = function () {
        const json = JSON.stringify({ url, tids: tidReport }, null, 2);
        navigator.clipboard.writeText(json).then(
            () => console.log('✅ 클립보드에 복사되었습니다.'),
            () => {
                console.log('클립보드 복사 실패. 아래 내용을 수동으로 복사하세요:');
                console.log(json);
            }
        );
    };

    console.log(
        '\n%c사용 가능한 함수:\n' +
        "  auditSelector('[data-tid=\"xxx\"]')  — 특정 selector 테스트\n" +
        '  auditSelectors({ KEY: selector, ... }) — 여러 selector 일괄 검증\n' +
        '  auditCopy()                           — 결과를 클립보드로 복사',
        'color:gray; font-style:italic'
    );
    console.groupEnd();

    return tidReport;
})();
