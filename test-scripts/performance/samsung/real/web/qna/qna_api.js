import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend } from 'k6/metrics';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { postSlackMessage, buildK6SummaryMessage, buildK6ErrorThreadBlocks } from '../../../../common/slack_helper.js';

const accounts = new SharedArray('accounts', function () {
    return JSON.parse(open('./accounts.json'));
});

// 내부 API 커스텀 메트릭
export const webQnaApiLogin = new Trend('web_qna_api_login', true);
export const webQnaApiList = new Trend('web_qna_api_list', true);
export const webQnaApiPresignedUrl = new Trend('web_qna_api_presigned_url', true);
export const webQnaApiCreate = new Trend('web_qna_api_create', true);

// 외부(S3) 커스텀 메트릭 — 성능 목표 판정 제외
export const webQnaApiS3Upload = new Trend('web_qna_api_s3_upload', true);

const scriptErrors = [];

export const options = {
    scenarios: {
        api: {
            executor: 'shared-iterations',
            vus: 300,
            iterations: 300,
        },
    },
    thresholds: {
        checks: ['rate>=0.95'],
        // 내부 API만 판정 (external 태그 제외)
        'http_req_duration{type:internal}': ['p(95)<5000'],
    },
};

export default function () {
    const credentials = accounts[(__VU - 1) % accounts.length];
    const BASE_URL = (__ENV.API_BASE_URL || __ENV.WEB_BASE_URL || __ENV.BASE_URL || '').replace(/\/$/, '');

    const jar = http.cookieJar();
    const internalParams = {
        headers: { 'Content-Type': 'application/json' },
        jar,
        tags: { account: credentials.EMAIL, type: 'internal' },
    };

    // 1. 로그인
    const loginStart = Date.now();
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email: credentials.EMAIL,
        password: credentials.PASSWORD,
    }), internalParams);
    const loginDuration = Date.now() - loginStart;
    webQnaApiLogin.add(loginDuration);
    console.log(`[VU${__VU}] login ${loginRes.status} ${loginDuration}ms`);

    const loginOk = check(loginRes, { 'login 2xx': (r) => r.status >= 200 && r.status < 300 });
    if (!loginOk) {
        scriptErrors.push({ message: `login failed [VU${__VU}]: ${loginRes.status}`, time: new Date().toISOString() });
        return;
    }

    // 2. QnA 목록 조회
    const listStart = Date.now();
    const listRes = http.get(`${BASE_URL}/qna/user`, {
        jar,
        tags: { account: credentials.EMAIL, type: 'internal' },
    });
    const listDuration = Date.now() - listStart;
    webQnaApiList.add(listDuration);
    const listOk = check(listRes, { 'list 200': (r) => r.status === 200 });
    console.log(`[VU${__VU}] list ${listRes.status} ${listDuration}ms`);
    if (!listOk) scriptErrors.push({ message: `list failed [VU${__VU}]: ${listRes.status} ${listRes.body}`, time: new Date().toISOString() });

    // 3. presigned URL 발급 (내부 API)
    const presignedStart = Date.now();
    const presignedRes = http.get(`${BASE_URL}/qna/presignedUrl`, {
        jar,
        tags: { account: credentials.EMAIL, type: 'internal' },
    });
    const presignedDuration = Date.now() - presignedStart;
    webQnaApiPresignedUrl.add(presignedDuration);
    console.log(`[VU${__VU}] presignedUrl ${presignedRes.status} ${presignedDuration}ms`);

    if (!check(presignedRes, { 'presignedUrl 200': (r) => r.status === 200 })) {
        scriptErrors.push({ message: `presignedUrl failed [VU${__VU}]: ${presignedRes.status} ${presignedRes.body}`, time: new Date().toISOString() });
        return;
    }
    const { uuid, presignedUrl } = presignedRes.json('data');

    // 4. S3 직접 업로드 (외부 — 성능 판정 제외)
    const s3Start = Date.now();
    const s3Res = http.put(presignedUrl, `<p>부하 테스트 문의 내용 VU${__VU}</p>`, {
        headers: { 'Content-Type': 'text/html' },
        tags: { type: 'external' },
    });
    const s3Duration = Date.now() - s3Start;
    webQnaApiS3Upload.add(s3Duration);
    console.log(`[VU${__VU}] s3_upload ${s3Res.status} ${s3Duration}ms`);

    // 5. QnA 문의 생성
    const createStart = Date.now();
    const createRes = http.post(`${BASE_URL}/qna/user`, JSON.stringify({
        title: `부하 테스트 문의 VU${__VU}`,
        uuid,
    }), internalParams);
    const createDuration = Date.now() - createStart;
    webQnaApiCreate.add(createDuration);
    const createOk = check(createRes, { 'create 200/201': (r) => r.status === 200 || r.status === 201 });
    console.log(`[VU${__VU}] create ${createRes.status} ${createDuration}ms`);
    if (!createOk) scriptErrors.push({ message: `create failed [VU${__VU}]: ${createRes.status} ${createRes.body}`, time: new Date().toISOString() });
}

export function handleSummary(data) {
    const timestamp = getFormattedTimestamp().replace(/\s/g, '_');
    const token = __ENV.SLACK_BOT_TOKEN;
    const channel = __ENV.SLACK_CHANNEL_ID;
    if (token && channel) {
        const payload = buildK6SummaryMessage(data, 'Web QnA API', scriptErrors.length > 0);
        const ts = postSlackMessage(token, channel, payload);
        if (ts && scriptErrors.length > 0) {
            postSlackMessage(token, channel, buildK6ErrorThreadBlocks(scriptErrors), ts);
        }
    }
    return {
        [`Result/web_qna_api_${timestamp}.html`]: htmlReport(data),
        [`Result/web_qna_api_${timestamp}.json`]: JSON.stringify(data, null, 2),
    };
}
