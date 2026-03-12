// k6: __ENV.BASE_URL / Node(Playwright): process.env.BASE_URL
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Node에서 직접 실행 시 .env 로드 (Playwright/npm test가 아닐 때)
if (typeof process !== 'undefined' && typeof __ENV === 'undefined') {
    try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const require = createRequire(import.meta.url);
        require('dotenv').config({ path: path.resolve(__dirname, '../..', '.env') });
    } catch (_) {
        // dotenv 없거나 로드 실패 시 무시 (이미 환경변수로 주입된 경우 대비)
    }
}

let BASE_URL;
if (typeof __ENV !== 'undefined' && __ENV.BASE_URL) {
    BASE_URL = __ENV.BASE_URL.replace(/\/$/, '');
} else if (typeof process !== 'undefined' && process.env?.BASE_URL) {
    BASE_URL = process.env.BASE_URL.replace(/\/$/, '');
} else {
    throw new Error(
        'BASE_URL이 필요합니다. Playwright: BASE_URL=... npm test 또는 .env에 BASE_URL 설정'
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

    // 백오피스
    CREATE: `${BASE_URL}/autodoc/document/list`,
    NEW: `${BASE_URL}/autodoc/tool?formType=`, // 신규 양식
    CATEGORY: `${BASE_URL}/autodoc/categories`, // 카테고리

    // 서비스
    STANDARD: `${BASE_URL}/autodoc?method=standard&page=1`,
    TEMP: `${BASE_URL}/autodoc?method=temp&page=1`,
    EXISTING: `${BASE_URL}/autodoc?method=existing&page=1`,
}

//AI 외부 데이터 관리
export const AI_DATA_URLS = {
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
    PRIVACY: `${BASE_URL}/service-terms?tab=privacy`, //약관 관리 - 개인정보처리방침
    TERMS: `${BASE_URL}/service-terms?tab=terms`, //약관 관리 - 이용약관
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

// 서비스 - 문서 조회
export const DRIVE_URLS = {
    DRIVE: `${BASE_URL}/drive`,
}

// 모든 URL을 하나의 객체로 통합
export const URLS = {
    BASE: BASE_URL,
    LOGIN: LOGIN_URLS,
    AUTODOC: AUTODOC_URLS,
    AI_DATA: AI_DATA_URLS,
    AI_CHAT: AI_CHAT_URLS,
    DOCUMENT_UPDATE: DOCUMENT_UPDATE_URLS,
    FILTERING: FILTERING_URLS,
    SERVICE: SERVICE_URLS,
    MEMBER: MEMBER_URLS,
    LOG: LOG_URLS,
    DRIVE: DRIVE_URLS,
}; 

if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
    console.log('BASE_URL:', BASE_URL);
}