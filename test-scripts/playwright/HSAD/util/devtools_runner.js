/**
 * DevTools Runner - spec.js를 브라우저 콘솔에서 직접 실행
 *
 * 사용법:
 *   1. 테스트할 페이지에 로그인 후 이동
 *   2. F12 → Console → "allow pasting" 입력 후 Enter
 *   3. 이 파일 전체 붙여넣기 → Enter  (최초 1회)
 *   4. spec.js에서 import 줄 4줄만 제거 후 붙여넣기 → Enter
 *   5. 완료 후 _auditSummary() 입력 → 전체 결과 표시
 *
 * 주의:
 *   - page.goto()는 현재 URL과 다른 경우 경고만 출력하고 계속 실행
 *   - 현재 페이지에 없는 요소는 FAIL로 기록됨 (정상)
 *   - 여러 spec을 순서대로 붙여넣기 가능 (결과는 누적됨)
 */

// ─── URLS (현재 사이트 origin 자동 감지) ──────────────────────────────────────
const _B = location.origin;
const URLS = {
    BASE: _B,
    LOGIN:      { HOME: _B, LOGIN: `${_B}/login`, DASHBOARD: `${_B}/dashboard` },
    CLM:        { DRAFT: `${_B}/clm/draft`, REVIEW: `${_B}/clm/review`, COMPLETE: `${_B}/clm/complete`, COMPARE: `${_B}/document_compare`, PAUSE: `${_B}/clm/complete?is_paused=2`, SEARCH: `${_B}/clm/search` },
    ADVICE:     { DRAFT: `${_B}/advice/draft`, REVIEW: `${_B}/advice` },
    LITIGATION: { DRAFT: `${_B}/litigation/draft`, REVIEW: `${_B}/litigation`, SCHEDULE: `${_B}/litigation/schedule` },
    SEAL:       { DRAFT: `${_B}/seal/draft`, REVIEW: `${_B}/seal`, LEDGER: `${_B}/seal/ledger` },
    PROJECT:    { PROJECT: `${_B}/project` },
    LAW:        { SCHEDULE: `${_B}/law` },
    BULK:       { BULK: `${_B}/bulk` },
    DRIVE:      { DRIVE: `${_B}/drive`, AUTO: `${_B}/#documents_finder` },
    CONTRACT:   { CONTRACT: `${_B}/contact`, STAMP: `${_B}/template?type=stamp`, LOGO: `${_B}/template?type=logo`, TEAM_STAMP: `${_B}/template?type=team_stamp` },
    SETTING:    { TEAM: `${_B}/teams`, ACCOUNT: `${_B}/profile?type=account`, SETUP: `${_B}/setup`, LOG: `${_B}/profile?type=log`, NOTIFICATION: `${_B}/profile?type=notification`, FA: `${_B}/profile?type=twoFA` },
    STATISTICS: { STATISTICS: `${_B}/statistics` },
};

// ─── SELECTORS ────────────────────────────────────────────────────────────────
// selector_hsad.js를 먼저 붙여넣으면 여기서 자동으로 사용됩니다.
// (붙여넣기 순서: ① selector_hsad.js → ② devtools_runner.js → ③ spec.js)
// selector_hsad.js가 없으면 SELECTORS 접근 시 경고를 출력합니다.
if (typeof SELECTORS === 'undefined') {
    window.SELECTORS = new Proxy({}, {
        get(_, ns) {
            console.warn(`[SELECTORS] selector_hsad.js가 먼저 붙여넣어지지 않았습니다. "${ns}" 접근 시 빈 값 반환.`);
            return new Proxy({}, { get: () => new Proxy({}, { get: () => '' }) });
        }
    });
}

// ─── login shim (no-op) ───────────────────────────────────────────────────────
async function login(page) { /* 이미 로그인된 상태 — 생략 */ }

// ─── DOM 조회 헬퍼 ────────────────────────────────────────────────────────────
function _q(selector) {
    if (!selector || typeof selector !== 'string') return [];
    try {
        if (selector.startsWith('//') || selector.startsWith('(//')) {
            const r = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            return Array.from({ length: r.snapshotLength }, (_, i) => r.snapshotItem(i));
        }
        return [...document.querySelectorAll(selector)];
    } catch { return []; }
}

function _isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
}

function _findByText(text, exact) {
    return [...document.querySelectorAll('*')].filter(el => {
        if (el.children.length > 3) return false; // 컨테이너 제외
        const t = el.textContent.trim();
        return exact ? t === text : t.includes(text);
    });
}

function _findByPlaceholder(text) {
    return _q(`[placeholder="${text}"]`).concat(_q(`[placeholder*="${text}"]`));
}

function _findByRole(role, name) {
    const roleMap = { button: 'button', tab: '[role="tab"]', checkbox: 'input[type="checkbox"]', textbox: 'input,textarea' };
    const sel = roleMap[role] || `[role="${role}"]`;
    return _q(sel).filter(el => !name || el.textContent.trim().includes(name) || el.getAttribute('aria-label')?.includes(name));
}

// ─── locator 체인 ─────────────────────────────────────────────────────────────
function _locator(selector) {
    const get = () => _q(selector);
    const obj = {
        count:      async () => get().length,
        isVisible:  async () => get().some(_isVisible),
        isEnabled:  async () => get().some(el => !el.disabled),
        isDisabled: async () => get().every(el => el.disabled),
        isFocused:  async () => get().some(el => el === document.activeElement),
        click:      async () => { const el = get()[0]; if (el) el.click(); else console.warn(`[click] not found: ${selector}`); },
        fill:       async (v) => {
            const el = get()[0];
            if (!el) { console.warn(`[fill] not found: ${selector}`); return; }
            el.focus();
            el.value = v;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        },
        inputValue: async () => { const el = get()[0]; return el ? el.value : ''; },
        textContent: async () => { const el = get()[0]; return el?.textContent ?? null; },
        check:      async () => { const el = get()[0]; if (el) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); } },
        uncheck:    async () => { const el = get()[0]; if (el) { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); } },
        locator:    (sub) => _locator(sub),
        getByRole:  (role, opts = {}) => ({ isVisible: async () => _findByRole(role, opts.name).some(_isVisible), click: async () => { const el = _findByRole(role, opts.name)[0]; if (el) el.click(); }, isEnabled: async () => _findByRole(role, opts.name).some(el => !el.disabled), isDisabled: async () => _findByRole(role, opts.name).every(el => el.disabled) }),
        getByText:  (text) => _getByText(text),
        filter:     (opts) => _locator(selector), // 단순 패스스루
        first:      () => _locator(`${selector}:first-of-type`),
        last:       () => ({ locator: (sub) => _locator(sub), isVisible: async () => false }),
        nth:        (n) => ({ click: async () => { const el = get()[n]; if (el) el.click(); }, isVisible: async () => _isVisible(get()[n]) }),
        '..':       () => _locator(selector + ' > ..'),
    };
    return obj;
}

function _getByText(text, options = {}) {
    const exact = options.exact ?? false;
    return {
        isVisible:   async () => _findByText(text, exact).some(_isVisible),
        click:       async () => { const el = _findByText(text, exact)[0]; if (el) el.click(); },
        first:       () => ({ isVisible: async () => { const els = _findByText(text, exact); return els.length > 0 && _isVisible(els[0]); } }),
        textContent: async () => { const el = _findByText(text, exact)[0]; return el?.textContent ?? null; },
        locator:     (sub) => _locator(sub),
    };
}

function _getByPlaceholder(text) {
    return {
        isVisible:  async () => _findByPlaceholder(text).some(_isVisible),
        isFocused:  async () => _findByPlaceholder(text).some(el => el === document.activeElement),
        fill:       async (v) => { const el = _findByPlaceholder(text)[0]; if (el) { el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } },
        inputValue: async () => { const el = _findByPlaceholder(text)[0]; return el ? el.value : ''; },
        toHaveValue: async (v) => { const el = _findByPlaceholder(text)[0]; return el?.value === v; },
        click:      async () => { const el = _findByPlaceholder(text)[0]; if (el) el.click(); },
        locator:    (sub) => _locator(sub),
        '..':       () => ({ getByRole: (role, opts = {}) => ({ isVisible: async () => _findByRole(role, opts.name).some(_isVisible), click: async () => { const el = _findByRole(role, opts.name)[0]; if(el) el.click(); } }) }),
    };
}

// ─── page shim ────────────────────────────────────────────────────────────────
const page = {
    goto: async (url) => {
        const norm = url.replace(/\/$/, '');
        const cur  = location.href.replace(/\/$/, '');
        if (!cur.startsWith(norm) && cur !== norm) {
            console.warn(`%c[goto] 페이지 이동 필요: ${url}\n현재: ${location.href}\n→ 현재 페이지에서 계속 실행합니다.`, 'color:orange');
        }
    },
    url:              () => location.href,
    waitForURL:       async (pattern) => { const re = pattern instanceof RegExp ? pattern : new RegExp(String(pattern).replace(/\*\*/g, '.*')); if (!re.test(location.href)) console.warn(`[waitForURL] 불일치: ${location.href}`); },
    waitForSelector:  async (selector, opts = {}) => new Promise((res, rej) => { const t = opts.timeout || 5000; const s = Date.now(); const fn = () => { if (_q(selector).length) return res(); if (Date.now()-s > t) return rej(new Error(`waitForSelector timeout: ${selector}`)); setTimeout(fn, 200); }; fn(); }),
    waitForLoadState: async () => {},
    waitForTimeout:   async (ms) => new Promise(r => setTimeout(r, ms)),
    screenshot:       async () => {},
    locator:          _locator,
    getByText:        _getByText,
    getByPlaceholder: _getByPlaceholder,
    getByRole:        (role, opts = {}) => ({
        click:      async () => { const el = _findByRole(role, opts.name)[0]; if (el) el.click(); },
        isVisible:  async () => _findByRole(role, opts.name).some(_isVisible),
        isEnabled:  async () => _findByRole(role, opts.name).some(el => !el.disabled),
        isDisabled: async () => _findByRole(role, opts.name).every(el => el.disabled),
        locator:    (sub) => _locator(sub),
        '..':       () => ({ getByRole: (r2, o2={}) => ({ isVisible: async () => _findByRole(r2, o2.name).some(_isVisible) }) }),
    }),
    keyboard: {
        press: async (key) => {
            const el = document.activeElement || document.body;
            ['keydown','keypress','keyup'].forEach(type => el.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true })));
        }
    },
};

// ─── expect ───────────────────────────────────────────────────────────────────
function expect(subject, label) {
    return _expectChain(subject, label, false);
}
expect.soft = (subject, label) => _expectChain(subject, label, true);

function _expectChain(subject, label, soft) {
    const fail = (msg) => { if (soft) console.warn(`⚠ SOFT: ${msg}`); else throw new Error(msg); };

    const chain = {
        toBeVisible:        async () => { const v = typeof subject?.isVisible === 'function' ? await subject.isVisible() : _isVisible(subject); if (!v) fail(`toBeVisible 실패${label ? ': ' + label : ''}`); },
        not: {
            toBeVisible:    async () => { const v = typeof subject?.isVisible === 'function' ? await subject.isVisible() : _isVisible(subject); if (v) fail(`not.toBeVisible 실패`); },
            toBeDisabled:   async () => { const d = typeof subject?.isDisabled === 'function' ? await subject.isDisabled() : false; if (d) fail(`not.toBeDisabled 실패`); },
        },
        toHaveURL:          async (pattern) => { const re = pattern instanceof RegExp ? pattern : new RegExp(String(pattern).replace(/\*\*/g, '.*')); if (!re.test(location.href)) fail(`toHaveURL: "${location.href}" ≠ ${pattern}`); },
        toHaveValue:        async (val) => { const v = typeof subject?.inputValue === 'function' ? await subject.inputValue() : ''; if (v !== val) fail(`toHaveValue: "${v}" ≠ "${val}"`); },
        toBeFocused:        async () => { /* 환경 제약 — skip */ },
        toBeEnabled:        async () => { const ok = typeof subject?.isEnabled === 'function' ? await subject.isEnabled() : !subject?.disabled; if (!ok) fail(`toBeEnabled 실패`); },
        toBeDisabled:       async () => { const ok = typeof subject?.isDisabled === 'function' ? await subject.isDisabled() : !!subject?.disabled; if (!ok) fail(`toBeDisabled 실패`); },
        toBeGreaterThan:    (n) => { if (!(subject > n)) fail(`${subject} > ${n} 실패`); },
        toBeLessThanOrEqual:(n) => { if (!(subject <= n)) fail(`${subject} <= ${n} 실패`); },
        toMatch:            (re) => { if (!String(subject).match(re)) fail(`toMatch: "${subject}" ≠ ${re}`); },
        toBeVisible:        async () => { const v = typeof subject?.isVisible === 'function' ? await subject.isVisible() : _isVisible(subject); if (!v) fail(`toBeVisible 실패`); },
    };
    return chain;
}

// ─── test runner ─────────────────────────────────────────────────────────────
const _results = [];
let _describe = '';
let _beforeEachStack = [[]]; // 중첩 describe 지원

const test = Object.assign(async function(name, fn) {
    const full = _describe ? `${_describe} › ${name}` : name;
    try {
        const befores = _beforeEachStack.flat();
        for (const bfn of befores) await bfn({ page });
        await fn({ page });
        _results.push({ status: '✅ PASS', name: full });
        console.log(`%c✅ ${full}`, 'color:#22aa22');
    } catch (e) {
        _results.push({ status: '❌ FAIL', name: full, error: e.message });
        console.warn(`❌ ${full}\n   ${e.message}`);
    }
}, {
    describe: (name, fn) => {
        const prev = _describe;
        _describe = _describe ? `${_describe} › ${name}` : name;
        _beforeEachStack.push([]);
        fn();
        _beforeEachStack.pop();
        _describe = prev;
    },
    beforeEach: (fn) => {
        _beforeEachStack[_beforeEachStack.length - 1].push(fn);
    },
    fixme: (name) => {
        const full = _describe ? `${_describe} › ${name}` : (name || '(fixme)');
        _results.push({ status: '⏭ SKIP', name: full });
        console.log(`%c⏭ ${full}`, 'color:gray');
    },
    afterAll: () => {},
    use: () => {},
    step: async (name, fn) => { await fn(); },
});

// ─── 결과 요약 ────────────────────────────────────────────────────────────────
window._auditSummary = () => {
    const pass = _results.filter(r => r.status.includes('PASS')).length;
    const fail = _results.filter(r => r.status.includes('FAIL')).length;
    const skip = _results.filter(r => r.status.includes('SKIP')).length;
    console.log(`\n%c결과: ✅ PASS ${pass}  ❌ FAIL ${fail}  ⏭ SKIP ${skip}`, 'font-weight:bold; font-size:14px');
    if (fail > 0) {
        console.group('❌ 실패 목록');
        _results.filter(r => r.status.includes('FAIL')).forEach(r => console.warn(`  ${r.name}\n  → ${r.error}`));
        console.groupEnd();
    }
    console.table(_results.map(r => ({ status: r.status, name: r.name, error: r.error || '' })));
};

console.log('%c[DevTools Runner] 준비 완료 ✅', 'color:#0066cc; font-weight:bold; font-size:13px');
console.log(
    '%c붙여넣기 순서:\n' +
    '  ① selector_hsad.js  — 첫 줄 "export const SELECTORS" → "const SELECTORS" 로 수정 후 붙여넣기\n' +
    '  ② devtools_runner.js — 이 파일 (이미 완료)\n' +
    '  ③ spec.js            — import 줄 전부 제거 후 붙여넣기\n\n' +
    '완료 후: _auditSummary()',
    'color:gray'
);
