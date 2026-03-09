/**
 * Slack Incoming Webhook 헬퍼 (Node.js/Playwright)
 * fetch API 사용
 */

/**
 * Slack Incoming Webhook으로 메시지 전송
 * @param {string} webhookUrl - Slack Webhook URL
 * @param {object} payload - Slack API payload (text 또는 blocks)
 * @returns {Promise<{ ok: boolean, status?: number }>} 응답 결과
 */
export async function sendSlackWebhook(webhookUrl, payload) {
  if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://')) {
    return { ok: false };
  }
  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: resp.status === 200, status: resp.status };
  } catch (e) {
    console.warn('[Slack] fetch 실패:', e.message);
    return { ok: false };
  }
}

/**
 * Playwright 테스트 결과로부터 Slack 메시지 payload 생성
 * @param {object} result - { passed, testName, durationMs? }
 * @returns {object} Slack blocks payload
 */
export function buildPlaywrightSummaryMessage(result) {
  const { passed, testName, durationMs = 0 } = result;
  const statusEmoji = passed ? ':white_check_mark:' : ':x:';
  const durationSec = (durationMs / 1000).toFixed(1);

  return {
    text: `[Playwright] ${testName}: ${passed ? '성공' : '실패'}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${statusEmoji} Playwright: ${testName}`, emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*상태:*\n${passed ? '성공' : '실패'}` },
          { type: 'mrkdwn', text: `*테스트 시간:*\n${durationSec}s` },
        ],
      },
    ],
  };
}

/** @deprecated k6 전용 - Playwright에서는 buildPlaywrightSummaryMessage 사용 */
export function buildK6SummaryMessage(data, testName = 'k6 Test') {
  return buildPlaywrightSummaryMessage({
    passed: true,
    testName,
    durationMs: 0,
  });
}
