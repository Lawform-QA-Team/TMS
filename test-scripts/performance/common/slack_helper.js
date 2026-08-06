/**
 * Slack Slackbot 헬퍼 (k6용)
 * k6/http를 사용해 Slack Bot API(chat.postMessage)로 메시지 전송
 *
 * 환경 변수:
 *   SLACK_BOT_TOKEN   - Slack Bot OAuth Token (xoxb-...)
 *   SLACK_CHANNEL_ID  - 발송 대상 채널 ID
 */
import http from 'k6/http';

const SLACK_API_URL = 'https://slack.com/api/chat.postMessage';
const BLOCK_TEXT_MAX = 2900;

function truncate(s) {
    return s.length > BLOCK_TEXT_MAX ? s.slice(0, BLOCK_TEXT_MAX) + '\n...(생략됨)' : s;
}

/**
 * Slack Bot API로 메시지 전송
 * @param {string} token - Bot OAuth Token
 * @param {string} channel - 채널 ID
 * @param {object} payload - attachments 포함 payload
 * @param {string|null} threadTs - 스레드 답글용 ts (없으면 null)
 * @returns {string|null} 메시지 ts (스레드 답글에 사용) 또는 null
 */
export function postSlackMessage(token, channel, payload, threadTs = null) {
    if (!token || !channel) return null;

    const body = { channel, ...payload };
    if (threadTs) body.thread_ts = threadTs;

    const resp = http.post(SLACK_API_URL, JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    try {
        const json = JSON.parse(resp.body);
        if (!json.ok) {
            console.warn(`[Slack] 메시지 발송 실패: ${json.error}`);
            return null;
        }
        return json.ts ?? null;
    } catch (e) {
        console.warn(`[Slack] 응답 파싱 실패: ${e.message}`);
        return null;
    }
}

/**
 * k6 Summary 메인 메시지 payload 생성 (attachments 포함)
 * @param {object} data - k6 handleSummary data 객체
 * @param {string} testName - 테스트 이름
 * @param {boolean} hasErrors - 스크립트 실행 중 catch된 에러 존재 여부
 * @returns {object} Slack attachments payload
 */
export function buildK6SummaryMessage(data, testName = 'k6 Test', hasErrors = false) {
    const metrics = data?.metrics || {};
    const state = data?.state || {};
    const rootGroup = data?.root_group || {};

    const checks = rootGroup.checks || [];
    const totalPasses = checks.reduce((sum, c) => sum + (c.passes || 0), 0);
    const totalFails = checks.reduce((sum, c) => sum + (c.fails || 0), 0);

    let thresholdFailed = false;
    for (const metricName of Object.keys(metrics)) {
        const thresh = metrics[metricName]?.thresholds;
        if (thresh && typeof thresh === 'object') {
            for (const t of Object.values(thresh)) {
                if (t && t.ok === false) { thresholdFailed = true; break; }
            }
        }
    }

    const failed = totalFails > 0 || thresholdFailed || hasErrors;
    const color = failed ? '#ff0000' : '#36a64f';
    const statusEmoji = failed ? '❌' : '✅';

    const durationSec = ((state.testRunDurationMs ?? 0) / 1000).toFixed(1);
    const iterations = metrics.iterations?.values?.count ?? '-';
    const vus = metrics.vus?.values?.value ?? metrics.vus?.values?.max ?? '-';

    const httpDuration = metrics['http_req_duration']?.values;
    const avgLatency = httpDuration?.avg != null ? `${httpDuration.avg.toFixed(0)}ms` : '-';
    const p95Latency = httpDuration?.['p(95)'] != null ? `${httpDuration['p(95)'].toFixed(0)}ms` : '-';

    const blocks = [
        {
            type: 'header',
            text: { type: 'plain_text', text: `${statusEmoji} k6 결과: ${testName}`, emoji: true },
        },
        {
            type: 'section',
            fields: [
                { type: 'mrkdwn', text: `*상태:*\n${failed ? '실패' : '성공'}` },
                { type: 'mrkdwn', text: `*테스트 시간:*\n${durationSec}s` },
                { type: 'mrkdwn', text: `*Iterations:*\n${iterations}` },
                { type: 'mrkdwn', text: `*VUs:*\n${vus}` },
                { type: 'mrkdwn', text: `*체크:*\n${totalPasses} pass / ${totalFails} fail` },
                ...(thresholdFailed ? [{ type: 'mrkdwn', text: `*⚠️ Threshold:*\n실패` }] : []),
            ],
        },
    ];

    if (avgLatency !== '-') {
        blocks.push({
            type: 'section',
            fields: [
                { type: 'mrkdwn', text: `*평균 지연:*\n${avgLatency}` },
                { type: 'mrkdwn', text: `*p95 지연:*\n${p95Latency}` },
            ],
        });
    }

    // 커스텀 Trend 메트릭 추출 (액션별 응답 시간)
    const STANDARD_METRICS = new Set([
        'iterations', 'vus', 'vus_max', 'data_received', 'data_sent',
        'checks', 'group_duration',
    ]);
    const customTrends = Object.entries(metrics)
        .filter(([name, m]) => {
            if (STANDARD_METRICS.has(name)) return false;
            if (name.startsWith('http_') || name.startsWith('browser_')) return false;
            return m.values != null && 'avg' in m.values;
        })
        .map(([name, m]) => ({
            label: name.replace(/_/g, ' '),
            avg: m.values.avg != null ? `${m.values.avg.toFixed(0)}ms` : '-',
            p95: m.values['p(95)'] != null ? `${m.values['p(95)'].toFixed(0)}ms` : '-',
        }));

    if (customTrends.length > 0) {
        blocks.push({ type: 'divider' });
        const fields = customTrends.map(t => ({
            type: 'mrkdwn',
            text: `*${t.label}:*\navg ${t.avg}  /  p95 ${t.p95}`,
        }));
        // Slack section fields 최대 10개 제한
        for (let i = 0; i < fields.length; i += 10) {
            blocks.push({ type: 'section', fields: fields.slice(i, i + 10) });
        }
    }

    if (failed && hasErrors) {
        blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: '*오류 상세는 아래 스레드를 확인하세요.*' },
        });
    } else if (!failed) {
        blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: '*대상 페이지 성능 측정 완료!*' },
        });
    }

    return {
        text: `[k6] ${testName}: ${failed ? '실패' : '성공'}`,
        attachments: [{ color, blocks }],
    };
}

/**
 * 에러 스레드 블록 생성 (실패 상세, playwright buildThreadBlocks 대응)
 * @param {Array<{message: string, stack?: string, time?: string}>} errors
 * @returns {object} Slack attachments payload
 */
export function buildK6ErrorThreadBlocks(errors) {
    const blocks = [
        {
            type: 'header',
            text: { type: 'plain_text', text: `❌ 오류 상세 (${errors.length}건)`, emoji: true },
        },
    ];

    for (const err of errors) {
        if (err.message) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*에러 메시지:*\n\`\`\`${truncate(err.message)}\`\`\``,
                },
            });
        }
        if (err.stack) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*스택:*\n\`\`\`${truncate(err.stack)}\`\`\``,
                },
            });
        }
        if (err.time) {
            blocks.push({
                type: 'context',
                elements: [{ type: 'mrkdwn', text: `발생 시각: ${err.time}` }],
            });
        }
        blocks.push({ type: 'divider' });
    }

    return { attachments: [{ color: '#ff0000', blocks }] };
}
