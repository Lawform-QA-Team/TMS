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
    CREATE: `${BASE_URL}/autodoc/document/list`, // 표준 양식 등록
    NEW: `${BASE_URL}/autodoc/tool?formType=`, // 신규 양식
}

//AI 외부 데이터 관리
export const AI_DATE_URLS = {
    LAW: `${BASE_URL}/ai-external-data` || `${BASE_URL}/ai-external-data?tab=law`,
    COMPANY: `${BASE_URL}/ai-external-data?tab=company`
}

//AI 채팅 테이터 관리
export const AI_CHAT_URLS ={
    CHATLOG: `${BASE_URL}/ai-chat-log` || `${BASE_URL}/ai-chat-log?tab=chat-log`,
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
}

//사용자 관리
export const MEMBER_URLS = {
    BACKOFFICE: `${BASE_URL}/member` || `${BASE_URL}/member?tab=backoffice&page=1`, //사용자 관리 - 백오피스
    SERVICE: `${BASE_URL}/member?tab=service&page=1`, //사용자 관리 - 서비스 관리
}

//로그 관리
export const LOG_URLS = {
    LOG: `${BASE_URL}/log`,
}

// 로그인 등 공통 셀렉터 (k6 browser 스크립트용)
export const SELECTORS = {
    LOGIN: {
        EMAIL_INPUT: 'input[id="email"]',
        PASSWORD_INPUT: 'input[id="password"]',
        SUBMIT_BUTTON: 'button[type="submit"]',
        LOGOUT: '//button[text()="로그아웃"]',
    },
    
    
    NOTICE: {
        REGISTER: '#notice-filters-register-btn', // 공지사항 등록 (id 셀렉터)
        REGISTER_BUTTON: 'button[id="notice-filters-register-btn"]', // 동일 버튼 CSS
        SEARCH: 'button[id="search-btn"]', //검색
        INPUT: 'input[data-slot="input"]',
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