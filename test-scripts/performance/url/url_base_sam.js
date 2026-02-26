// k6: __ENV.BASE_URL / Node: process.env.BASE_URL (동적 import 미지원 환경 대응)
let BASE_URL;
if (typeof __ENV !== 'undefined' && __ENV.BASE_URL) {
    BASE_URL = __ENV.BASE_URL;
    // console.log('BASE_URL:', BASE_URL);
} else if (typeof process !== 'undefined' && process.env && process.env.BASE_URL) {
    BASE_URL = process.env.BASE_URL;
    // console.log('BASE_URL:', BASE_URL);
} else {
    throw new Error(
        'BASE_URL이 필요합니다. k6 실행 예: k6 run -e BASE_URL=https://대상주소 -e LOGIN_EMAIL=... -e LOGIN_PASSWORD=... 스크립트경로\n' +
        '.env 사용 시: (test-scripts/performance 폴더에서) export $(grep -v "^#" .env | xargs) && k6 run ...'
    );
}

// 로그인 관련 URL
export const LOGIN_URLS = {
    HOME: `${BASE_URL}`,
    LOGIN: `${BASE_URL}/login`,
    DASHBOARD: `${BASE_URL}/dashboard` // 통계 = 대시보드
};

// 표준 양식 관리
export const AUTODOC_URLS = {
    AUTODOC: `${BASE_URL}/autodoc`,
    CREATE: `${BASE_URL}/autodoc/document/list`,
    NEW: `${BASE_URL}/autodoc/tool?formType=`, // 신규 양식
    CATEGORY: `${BASE_URL}/autodoc/categories` // 카테고리
}

//AI 외부 데이터 관리
export const AI_DATE_URLS = {
    LAW: `${BASE_URL}/ai-external-data?tab=law`,
    COMPANY: `${BASE_URL}/ai-external-data?tab=company`
}

//AI 채팅 테이터 관리
export const AI_CHAT_URLS ={
    CHATLOG: `${BASE_URL}/ai-chat-log?tab=chat-log`,
    CHATDATA: `${BASE_URL}/ai-chat-log?tab=preset-chat`,
}

//문서 업데이트 리포트
export const DOCUMENT_UPDATE_URLS = {
    LAW: `${BASE_URL}/document-update-report`,
}

//필터링 관리
export const FILTERING_URLS = {
    FILTERING: `${BASE_URL}/filtering`,
}

//서비스 관리
export const SERVICE_URLS = {
    NOTICE: `${BASE_URL}/notice`, //공지사항
    QNA: `${BASE_URL}/qna`, //1:1 문의 관리
    PRIVACY: `${BASE_URL}/terms?tab=privacy`, //약관 관리 - 개인정보처리방침
    TERMS: `${BASE_URL}/terms?tab=terms`, //약관 관리 - 이용약관
    IP: `${BASE_URL}/ip-management`  // IP 관리
}

//사용자 관리
export const MEMBER_URLS = {
    BACKOFFICE: `${BASE_URL}/members?tab=backoffice&page=1`, //사용자 관리 - 백오피스
    SERVICE: `${BASE_URL}/members?tab=service&page=1`, //사용자 관리 - 서비스 관리
}

//로그 관리
export const LOG_URLS = {
    LOG: `${BASE_URL}/log`,
}

// 로그인 등 공통 셀렉터 (k6 browser 스크립트용)
export const SELECTORS = {
    // 공통 셀렉터
    COMMON: {
        INPUT: 'input[data-slot="input"]', // 검색 필드 공통
        TABLE: 'tbody tr:first-child', // 테이블 첫 번째 행 선택
        SEARCH: 'button[id="search-btn"]', //검색 버튼
        PAGE_FIRST: 'button[aria-label="첫 페이지로 이동"]', // 첫 페이지로 이동 버튼
        PAGE_LAST: 'button[aria-label="마지막 페이지로 이동"]', // 마지막 페이지로 이동 버튼
        // header 셀렉터
        LOGOUT: '//button[text()="로그아웃"]', // 로그아웃 버튼
        LNG: 'button[aria-label="언어 선택"]', // 다국어 선택
        //footer 셀렉터
        PRIVACY: '//a[text()="개인정보 처리방침"]', // 개인정보처리방침
        TERMS: '//a[text()="이용약관"]', // 이용약관
    },

    // 로그인 셀렉터
    LOGIN: {
        EMAIL_INPUT: 'input[id="email"]',
        PASSWORD_INPUT: 'input[id="password"]',
        SUBMIT_BUTTON: 'button[type="submit"]',
    },

    // 통계
    DASHBOARD: {
        EXCEL_DOWNLOAD: '//button[text()="엑셀 다운로드"]',
    },

    // 표준 양식 관리 셀렉터
    AUTODOC: {
        CATEGORY: '//button[text()="카테고리 관리"]',
        UPDATE: '//button[text()="업데이트 추천"]',  // 미구현된 버튼
        DOCUMENT: '//button[text()="표준 양식 등록"]',

        SETTINGS: '//button[text()="표준 양식 설정"]',
        INFO: '//button[text()="표준 양식 정보 작성"]',

        // 표준 양식 등록 작성 필요

        WRITE: '//button[text()="작성하기"]',
        LOAD: '//button[text()="불러오기"]', // 중복이 가능해서 수정 필요
    },

    // AI 외부 데이터 관리
    AI_DATE: {
        // 탭
        PRIVACY: '//button[text()="법령"]',
        TERMS: '//button[text()="타사 문서"]',

        ACTIVATE: 'button[role="switch"]',
        TERMS: '//button[text()="보기"]',  // 중복이 가능해서 수정 필요
        LIST: '//button[text()="목록"]',

        WORD_INPUT: 'input[placeholder="구분을 입력해주세요"]',
        URL_INPUT: 'input[placeholder="https://www.samsung.com/sec/i..."]',
        EXTRACT: '//button[text()="텍스트 추출"]',
        LIST: '//button[text()="목록"]',
        REGISTER: '//button[text()="등록"]',
    },

    // AI 채팅 데이터 관리
    AI_CHAT: {
        LIST: '//button[text()="목록"]',
        REGISTER: '//button[text()="채팅 데이터 등록"]',

        QUESTION: 'input[placeholder="내용을 입력하세요"]',
        ANSWER: 'textarea[placeholder="내용을 입력하세요"]',
        AI_DRAFT: '//button[text()="AI 초안 작성"]',
        CLOSE: '//button[text()="취소"]',
        SAVE: '//button[text()="저장"]',

        SUBMIT: '//button[text()="등록"]',
    },

    // 문서 업데이트 리포트
    DOCUMENT_UPDATE: {
        WEEK: '//button[.//span[text()="전체 업데이트 이력"]]',
        CLOSE: '//button[text()="닫기"]',
        CONFIRM: '//button[text()="확인"]',
        VIEW_ORIGINAL: '//button[text()="원문보기"]',
    },
    
    // 필터링 관리
    FILTERING: {
        REGISTER: '//button[text()="필터링 등록"]',

        WORD_INPUT: 'input[placeholder="필터링 단어를 입력해 주세요"]',
        REASON_INPUT: 'input[placeholder="필터링 사유를 입력해 주세요"]',
        CLOSE: '//button[text()="닫기"]',
        SAVE: '//button[text()="저장"]',
    },

    // 공지사항 관리
    NOTICE: {
        REGISTER: '#notice-filters-register-btn', // 공지사항 등록 (id 셀렉터)
        
        LIST: '//button[text()="목록"]',
        SAVE: '//button[text()="저장"]'
    },

    // 1:1 문의 관리
    QNA: {
        QNA_BACK: '//a[text()="1:1 문의 관리"]',
        LIST: '//button[text()="목록"]',
        SAVE: '//button[text()="저장"]',
    },

    // 약관 관리
    TERMS: {
        // 탭
        PRIVACY: '//button[text()="개인정보처리방침"]',
        TERMS: '//button[text()="이용약관"]',

        REGISTER: '//button[text()="등록"]',

        LIST: '//button[text()="목록"]',
        SAVE: '//button[text()="저장"]',
    },

    // 사용자 관리
    MEMBER: {
        // 탭
        SERVICE: '//button[text()="서비스"]',
        BACKOFFICE: '//button[text()="백오피스"]',

        // 인수인계
        TRANSFER: '//button[text()="인수인계"]',

        // 권한
        MEMBER: '//span[text()="일반 사용자"]',
        ADMIN: '//span[text()="일반 관리자"]',
        MASTER: '//span[text()="최고 관리자"]',

        // 활성화 여부
        ACTIVE: '//span[text()="활성화"]',
        INACTIVE: '//span[text()="비활성화"]',

        // 작업
        AUTH_MAIL: '//span[text()="가입 승인 메일 수신"]',
        STATS_REPORT: '//span[text()="통계 리포트 메일 수신"]',
        LOG_REPORT: '//span[text()="로그 및 이상 징후 리포팅 메일 수신"]',
        DOCUMENT_UPDATE: '//span[text()="문서 업데이트 요약 메일 수신"]',

        // 가입 승인
        APPROVE: '//button[text()="승인"]',

        // 사용자 정보 수정 저장
        SAVE: '//button[text()="저장"]',
    },

    // 로그 조회
    LOG: {
        WEEK: '//button[.//span[text()="1주일"]]',
        MONTH_1: '//button[.//span[text()="1개월"]]',
        MONTH_3: '//button[.//span[text()="3개월"]]'
    }
};

// 모든 URL을 하나의 객체로 통합
export const URLS = {
    BASE: BASE_URL,
    LOGIN: LOGIN_URLS,
    AUTODOC: AUTODOC_URLS,
    AI_DATE: AI_DATE_URLS,
    AI_CHAT: AI_CHAT_URLS,
    DOCUMENT_UPDATE: DOCUMENT_UPDATE_URLS,
    FILTERING: FILTERING_URLS,
    SERVICE: SERVICE_URLS,
    MEMBER: MEMBER_URLS,
    LOG: LOG_URLS,
}; 

console.log('BASE_URL:', BASE_URL);