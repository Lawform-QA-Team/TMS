/**
 * Slack Incoming Webhook 헬퍼
 * k6 테스트 결과를 Slack으로 발송할 때 사용
 */
import http from 'k6/http';

/**
 * Slack Incoming Webhook으로 메시지 전송
 * @param {string} webhookUrl - Slack Webhook URL (예: https://hooks.slack.com/services/...)
 * @param {object} payload - Slack API payload (text 또는 blocks)
 * @returns {{ ok: boolean, status?: number }} 응답 결과
 */
export function sendSlackWebhook(webhookUrl, payload) {
    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://')) {
        return { ok: false };
    }
    const resp = http.post(webhookUrl, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
    });
    return { ok: resp.status === 200, status: resp.status };
}

/**
 * k6 Summary data로부터 Slack Block Kit 메시지 payload 생성
 * @param {object} data - k6 handleSummary data 객체
 * @param {string} testName - 테스트 이름
 * @returns {object} Slack blocks payload
 */
export function buildK6SummaryMessage(data, testName = 'k6 Test') {
    const metrics = data?.metrics || {};
    const state = data?.state || {};
    const rootGroup = data?.root_group || {};

    // 체크 결과
    const checks = rootGroup.checks || [];
    const totalPasses = checks.reduce((sum, c) => sum + (c.passes || 0), 0);
    const totalFails = checks.reduce((sum, c) => sum + (c.fails || 0), 0);

    // threshold 실패 여부 (selector timeout, uncaught exception 등으로 인한 실패 포함)
    let thresholdFailed = false;
    for (const metricName of Object.keys(metrics)) {
        const thresh = metrics[metricName]?.thresholds;
        if (thresh && typeof thresh === 'object') {
            for (const t of Object.values(thresh)) {
                if (t && t.ok === false) {
                    thresholdFailed = true;
                    break;
                }
            }
        }
    }

    // iterations 실패 (uncaught exception 시 iteration이 fail로 카운트됨)
    const iterFails = metrics.iterations?.values?.fails ?? 0;

    // 전체 실패 판정: 체크 실패 OR threshold 실패 OR iteration 실패
    const checksOk = totalFails === 0 && !thresholdFailed && iterFails === 0;

    // 주요 메트릭 추출
    const iterValues = metrics.iterations?.values || {};
    const iterations = iterValues.count ?? iterValues.passes ?? '-';
    const vus = metrics.vus?.values?.value ?? metrics.vus?.values?.max ?? '-';
    const durationMs = state.testRunDurationMs ?? 0;
    const durationSec = (durationMs / 1000).toFixed(1);

    // HTTP 메트릭 (있는 경우)
    const httpReqs = metrics.http_reqs?.values?.count ?? '-';
    const httpDuration = metrics['http_req_duration']?.values;
    const avgLatency = httpDuration?.avg != null ? `${(httpDuration.avg).toFixed(0)}ms` : '-';
    const p95Latency = httpDuration?.['p(95)'] != null ? `${(httpDuration['p(95)']).toFixed(0)}ms` : '-';

    // 브라우저 메트릭 (browser 사용 시)
    const browserSessions = metrics.browser_sessions?.values?.count ?? '-';

    const statusEmoji = checksOk ? ':white_check_mark:' : ':x:';

    const blocks = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `${statusEmoji} k6 결과: ${testName}`,
                emoji: true,
            },
        },
        {
            type: 'section',
            fields: [
                { type: 'mrkdwn', text: `*상태:*\n${checksOk ? '성공' : '실패'}` },
                { type: 'mrkdwn', text: `*테스트 시간:*\n${durationSec}s` },
                { type: 'mrkdwn', text: `*Iterations:*\n${iterations}` },
                { type: 'mrkdwn', text: `*VUs:*\n${vus}` },
                { type: 'mrkdwn', text: `*체크:*\n${totalPasses} pass / ${totalFails} fail` },
                { type: 'mrkdwn', text: `*브라우저 세션:*\n${browserSessions}` },
                ...(iterFails > 0 ? [{ type: 'mrkdwn', text: `*⚠️ Iteration 실패:*\n${iterFails}건` }] : []),
                ...(thresholdFailed ? [{ type: 'mrkdwn', text: `*⚠️ Threshold:*\n실패` }] : []),
            ],
        },
    ];

    if (httpReqs !== '-') {
        blocks.push({
            type: 'section',
            fields: [
                { type: 'mrkdwn', text: `*HTTP 요청:*\n${httpReqs}` },
                { type: 'mrkdwn', text: `*평균 지연:*\n${avgLatency}` },
                { type: 'mrkdwn', text: `*p95 지연:*\n${p95Latency}` },
            ],
        });
    }

    return {
        text: `[k6] ${testName}: ${checksOk ? '성공' : '실패'}`,
        blocks,
    };
}
