import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Node에서 직접 실행 시 .env 로드
if (typeof process !== 'undefined') {
    try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const require = createRequire(import.meta.url);
        require('dotenv').config({ path: path.resolve(__dirname, '../..', '.env') });
    } catch (_) {
        // dotenv 없거나 로드 실패 시 무시
    }
}

const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '');

// 로그인 관련 URL
export const LOGIN_URLS = {
    HOME: `${BASE_URL}`,
    LOGIN: `${BASE_URL}/login`,
    DASHBOARD: `${BASE_URL}/dashboard`
};

// 계약서 생성 관련 URL
export const DRIVE_URLS = {
    DRIVE: `${BASE_URL}/drive`,
    TEAM: `${BASE_URL}/team_standard_contract`,
    AUTO: `${BASE_URL}/#documents_finder`,
    CHECKLIST: `${BASE_URL}/ai/checklist`,
    GLD: `https://chatgld.io`
};

// 전체 통계
export const STATISTICS_URLS = {
    STATISTICS: `${BASE_URL}/statistics`
};

// 대량생성 관련 URL
export const BULK_URLS = {
    BULK: `${BASE_URL}/bulk`
};

// CLM 관련 URL
export const CLM_URLS = {
    DRAFT: `${BASE_URL}/clm/draft`,
    SEARCH: `${BASE_URL}/clm/search`,
    REVIEW: `${BASE_URL}/clm/review`,
    COMPLETE: `${BASE_URL}/clm/complete`,
    COMPARE: `${BASE_URL}/document_compare`,
    PAUSE: `${BASE_URL}/clm/complete?is_paused=2`
};

// SEAL 관련 URL
export const SEAL_URLS = {
    DRAFT: `${BASE_URL}/seal/draft`,
    REVIEW: `${BASE_URL}/seal`,
    LEDGER: `${BASE_URL}/seal/ledger`
};

// Advice 관련 URL
export const ADVICE_URLS = {
    DRAFT: `${BASE_URL}/advice/draft`,
    REVIEW: `${BASE_URL}/advice`
};

// Litigation 관련 URL
export const LITIGATION_URLS = {
    DRAFT: `${BASE_URL}/litigation/draft`,
    REVIEW: `${BASE_URL}/litigation`,
    SCHEDULE: `${BASE_URL}/litigation/schedule`
};

// 법령 정보 관련 URL
export const LAW_URLS = {
    SCHEDULE: `${BASE_URL}/law`
};

// 프로젝트 관련 URL
export const PROJECT_URLS = {
    PROJECT: `${BASE_URL}/project`
};

// 계약 정보 관리 관련 URL
export const CONTRACT_URLS = {
    CONTRACT: `${BASE_URL}/contact`,
    STAMP: `${BASE_URL}/template?type=stamp`,
    LOGO: `${BASE_URL}/template?type=logo`,
    TEAM_STAMP: `${BASE_URL}/template?type=team_stamp`,
    WATERMARK: `${BASE_URL}/template?type=watermark`
};

// 시스템 설정 관련 URL
export const SETTING_URLS = {
    TEAM: `${BASE_URL}/teams`,
    ACCOUNT: `${BASE_URL}/profile?type=account`,
    NOTIFICATION: `${BASE_URL}/profile?type=notification`,
    LOG: `${BASE_URL}/profile?type=log`,
    FAILEDLOG: `${BASE_URL}/profile?type=failedLog`,
    FA: `${BASE_URL}/profile?type=twoFA`,
    MANAGEMENT: `${BASE_URL}/profile?type=deviceManagement`,
    SETUP: `${BASE_URL}/setup`
};

// 로그인 셀렉터
export const SELECTORS = {
    LOGIN: {
        EMAIL_INPUT: 'input[type="email"]',
        PASSWORD_INPUT: 'input[type="password"]',
        SUBMIT_BUTTON: 'button[type="submit"]'
    },
    DASHBOARD: {
        SETTING: 'img[alt="setting"]',
        CLOSE: 'img[alt="close"]',
        GNB: 'img[alt="네비게이션 열기/접기 버튼"]'
    }
};

// 모든 URL을 하나의 객체로 통합
export const URLS = {
    BASE: BASE_URL,
    LOGIN: LOGIN_URLS,
    DRIVE: DRIVE_URLS,
    STATISTICS: STATISTICS_URLS,
    BULK: BULK_URLS,
    CLM: CLM_URLS,
    SEAL: SEAL_URLS,
    ADVICE: ADVICE_URLS,
    LITIGATION: LITIGATION_URLS,
    LAW: LAW_URLS,
    PROJECT: PROJECT_URLS,
    CONTRACT: CONTRACT_URLS,
    SETTING: SETTING_URLS
};
