// HSAD k6 browser 스크립트용 selector 모음
// FE test-tid 적용 후 각 값은 [data-tid="..."] 형태로 교체한다.
export const SELECTORS = {
    COMMON: {
        BUTTON_CANCEL: '[data-tid=""]',
        BUTTON_CONFIRM: '[data-tid=""]',
        BUTTON_CLOSE: '[data-tid=""]',
        BUTTON_SAVE: '[data-tid=""]',
        INPUT_SEARCH: '[data-tid=""]',
        TABLE_LIST: '[data-tid=""]',
        PAGINATION: '[data-tid=""]',
    },

    LOGIN: {
        EMAIL_INPUT: 'input[id="email"]',
        PASSWORD_INPUT: 'input[id="password"]',
        SUBMIT_BUTTON: 'button[type="submit"]',
        LOGOUT: 'img[alt="이동"]',
    },

    DASHBOARD: {
        SETTING: 'img[alt="setting"]',
        CLOSE: 'img[alt="close"]',
        GNB: 'img[alt="네비게이션 열기/접기 버튼"]',
        ESIGN_PENDING_CHECKBOX: '[data-tid=""]',
        ESIGN_PENDING_TILE: '[data-tid=""]',
    },

    CONTRACT_CREATE: {
        AUTODOC_TITLE: 'text="어떤 법률문서를 작성할까요?"',
        SEARCH_INPUT: 'input[placeholder="찾으시는 문서명을 입력해주세요"]',
        MENU_CERTIFIED_CONTENTS: 'text="내용증명"',
        MENU_PAYMENT_ORDER: 'text="지급명령"',
        MENU_CONTRACT: 'text="계약서"',
    },

    CONTRACT_REVIEW: {
        TITLE: 'text="계약 검토 요청 임시저장 리스트"',
        BUTTON_NEW_REVIEW: 'button:has-text("신규 검토 요청")',
        BUTTON_DELETE: 'button:has-text("삭제")',
    },

    CONTRACT_MANAGEMENT: {
        TAB_CORPORATE: 'text="법인"',
        TITLE: 'text="계약처 관리"',
        INPUT_COMPANY_SEARCH: 'input[placeholder="기업명을 검색해보세요"]',
    },

    ADVICE: {
        MENU: 'nav >> text="법률 자문"',
        SETTINGS_TITLE: 'text="법률 자문 관리"',
    },

    LITIGATION: {
        MENU: 'nav >> text="송무"',
        MENU_DRAFT: 'text="송무 등록"',
        MENU_REVIEW: 'text="송무 조회"',
        MENU_SCHEDULE: 'text="송무 전체 일정"',
    },

    LAW: {
        CALENDAR: '.calendar-view',
        CALENDAR_TITLE: 'text="법령 캘린더"',
    },

    PROJECT: {
        TITLE: 'text="프로젝트 조회"',
        SELECT_MAJOR_CATEGORY_TEXT: 'text="프로젝트 대분류"',
        SELECT_MAJOR_CATEGORY_PLACEHOLDER: '[placeholder="프로젝트 대분류"]',
    },

    SETTINGS: {
        ADVICE_GUIDE: 'text="법률 자문 관리 옵션을 설정해보세요"',
    },
};
