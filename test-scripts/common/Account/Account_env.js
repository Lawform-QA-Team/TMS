import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, getAccount, getAccountsByEnv } from './db.js';

let dotenvLoaded = false;
let dbInitialized = false;

async function _ensureDotenvLoaded() {
    if (dotenvLoaded) return;

    try {
        const dotenvModule = await import('dotenv');
        const dotenv = dotenvModule.default || dotenvModule;
        if (dotenv && typeof dotenv.config === 'function') {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            // ACCOUNT_ROOT 환경변수로 .env 위치 지정 (기본: test-scripts/)
            const root = process.env.ACCOUNT_ROOT || path.resolve(__dirname, '../..');
            const envPath = path.join(root, '.env');
            console.log('[Account_env] .env 파일 경로:', envPath);
            console.log('[Account_env] .env 파일 존재 여부:', fs.existsSync(envPath));

            const result = dotenv.config({ path: envPath });
            if (result.error) {
                console.error('[Account_env] .env 파일 로드 실패:', result.error);
            } else if (result.parsed) {
                console.log('[Account_env] .env 파일에서 로드된 키:', Object.keys(result.parsed));
            }
        }
    } catch (error) {
        console.log('[Account_env] dotenv 패키지가 없거나 로드 실패:', error.message);
    }

    dotenvLoaded = true;
    console.log('[Account_env] 환경변수 ACCOUNT:', process.env.ACCOUNT);
}

function _ensureDbInitialized() {
    if (!dbInitialized) {
        initializeDatabase();
        dbInitialized = true;
    }
}

/**
 * .env의 ACCOUNT/ENV/ROLE 값으로 DB에서 계정 정보를 조회해 환경변수로 주입
 *
 * .env 설정 예시:
 *   ACCOUNT=harim
 *   ENV=DEV
 *   ROLE=master
 *
 * @param {string|null} accountKey - 계정 키 (미지정 시 ACCOUNT 환경변수 사용)
 * @param {string|null} env        - DEV/PROD (미지정 시 ENV 환경변수, 기본 DEV)
 * @param {string|null} role       - 역할 (미지정 시 ROLE 환경변수, 기본 master)
 * @returns {Promise<{env, role, baseUrl, roleData, fullData}>}
 */
export async function loadAccountEnv(accountKey = null, env = null, role = null) {
    await _ensureDotenvLoaded();
    _ensureDbInitialized();

    const key = accountKey || process.env.ACCOUNT;
    const selectedEnv = (env || process.env.ENV || 'DEV').toUpperCase();
    const selectedRole = role || process.env.ROLE || 'master';

    console.log('[Account_env] 최종 key:', key, '/ ENV:', selectedEnv, '/ ROLE:', selectedRole);

    if (!key) {
        throw new Error('ACCOUNT 환경변수가 필요합니다 (.env 또는 인자).');
    }

    const account = await getAccount(key, selectedEnv, selectedRole);

    if (!account) {
        const accountsByEnv = await getAccountsByEnv(key, selectedEnv);
        const availableRoles = accountsByEnv.map(a => a.role).join(', ');
        throw new Error(
            `계정을 찾을 수 없습니다: ${key} - ${selectedEnv} - ${selectedRole}. ` +
            `사용 가능한 ROLE: ${availableRoles || '없음'}`
        );
    }

    console.log('[Account_env] DB에서 계정 정보 로드 성공');

    if (account.base_url && !('base_url' in process.env)) {
        process.env.base_url = account.base_url;
    }
    if (account.user_id) {
        const envKey = `${selectedRole.toUpperCase()}_ID`;
        if (!(envKey in process.env)) process.env[envKey] = account.user_id;
    }
    if (account.password) {
        const envKey = `${selectedRole.toUpperCase()}_PASSWORD`;
        if (!(envKey in process.env)) process.env[envKey] = account.password;
    }
    if (!('ENV' in process.env)) process.env.ENV = selectedEnv;
    if (!('ROLE' in process.env)) process.env.ROLE = selectedRole;

    console.log('[Account_env] 계정 데이터 로드 완료');

    const roleData = { id: account.user_id, password: account.password };
    return {
        env: selectedEnv,
        role: selectedRole,
        baseUrl: account.base_url,
        roleData,
        fullData: { [selectedEnv]: { base_url: account.base_url, [selectedRole]: roleData } }
    };
}

// 직접 실행 시 테스트
const __filename2 = fileURLToPath(import.meta.url);
const isDirectExecution = __filename2 === (process.argv[1] ? path.resolve(process.argv[1]) : '') ||
                          process.argv[1]?.includes('Account_env.js');

if (isDirectExecution) {
    loadAccountEnv()
        .then(data => console.log('\n[Account_env] 완료:', JSON.stringify(data, null, 2)))
        .catch(error => { console.error('\n[Account_env] 실패:', error.message); process.exit(1); });
}
