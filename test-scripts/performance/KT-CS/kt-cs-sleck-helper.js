// KT-CS k6 부하 테스트 — Slack 알림 헬퍼
// 삼성전자 프로젝트 스크립트에서 쓰던 postSlackMessage / buildK6SummaryMessage /
// buildK6ErrorThreadBlocks 사용 패턴(handleSummary에서 요약 메시지 발송 후,
// 에러가 있으면 스레드로 상세 내역 발송)을 동일하게 재현한 버전입니다.
// 원본 구현을 그대로 쓰던 프로젝트라면 이 파일을 원본으로 교체하세요.

import http from 'k6/http';

const SLACK_API_URL = 'https://slack.com/api/chat.postMessage';

/**
 * Slack에 메시지(payload: {blocks, text 등})를 보낸다.
 * threadTs가 있으면 해당 스레드에 답글로 보낸다.
 * 반환값: 성공 시 메시지의 ts (스레드 답글에 사용), 실패 시 null.
 */
export function postSlackMessage(token, channel, payload, threadTs) {
  const body = Object.assign(
    { channel },
    payload,
    threadTs ? { thread_ts: threadTs } : {}
  );

  const res = http.post(SLACK_API_URL, JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const json = res.json();
    if (!json.ok) {
      console.error(`[slack] postMessage 실패: ${json.error}`);
      return null;
    }
    return json.ts;
  } catch (e) {
    console.error(`[slack] postMessage 실패: HTTP ${res.status} ${res.body}`);
    return null;
  }
}

function fmtMs(v) {
  return v === undefined || v === null || Number.isNaN(v) ? '-' : `${Math.round(v)}ms`;
}

function fmtPct(v) {
  return v === undefined || v === null || Number.isNaN(v) ? '-' : `${(v * 100).toFixed(2)}%`;
}

/**
 * k6 handleSummary(data) 의 data 객체로부터 Slack 요약 메시지 블록을 만든다.
 * testName: 테스트 이름 (예: 'KT-CS Editor Flow')
 * hasErrors: scriptErrors.length > 0 여부 — 상단 상태 이모지/텍스트에 반영
 */
export function buildK6SummaryMessage(data, testName, hasErrors) {
  const m = data.metrics || {};
  const httpDur = m.http_req_duration?.values || {};
  const httpFailed = m.http_req_failed?.values || {};
  const checks = m.checks?.values || {};
  const vusMax = m.vus_max?.values?.value;
  const iterations = m.iterations?.values?.count;

  const statusEmoji = hasErrors ? '🔴' : '🟢';
  const statusText = hasErrors ? '오류 발생' : '정상 완료';

  return {
    text: `${statusEmoji} k6 부하 테스트 결과 — ${testName}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${statusEmoji} k6 부하 테스트 결과 — ${testName}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*상태*\n${statusText}` },
          { type: 'mrkdwn', text: `*최대 VU*\n${vusMax ?? '-'}` },
          { type: 'mrkdwn', text: `*총 이터레이션*\n${iterations ?? '-'}` },
          { type: 'mrkdwn', text: `*Checks 성공률*\n${fmtPct(checks.rate)}` },
          { type: 'mrkdwn', text: `*HTTP 실패율*\n${fmtPct(httpFailed.rate)}` },
          {
            type: 'mrkdwn',
            text: `*응답시간 평균 / p95*\n${fmtMs(httpDur.avg)} / ${fmtMs(httpDur['p(95)'])}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `실행 시각: ${new Date().toISOString()}` }],
      },
    ],
  };
}

/**
 * VU에서 수집한 scriptErrors 배열([{ message, time }, ...])을 Slack 스레드용
 * 블록으로 변환한다.
 *
 * ⚠️ 주의: k6는 VU마다 별도의 JS 실행 컨텍스트를 사용하므로, 모듈 최상단에
 * 선언한 scriptErrors 배열은 VU 간에 공유되지 않고, handleSummary가 실행되는
 * 컨텍스트에서도 실제로는 "그 컨텍스트 자신의" 배열만 보인다. 즉 다중 VU
 * 실행에서는 이 배열에 모든 VU의 에러가 다 모이지 않을 수 있다 — 정확한 전체
 * 에러 집계가 필요하면 data.metrics.checks 나 커스텀 Counter 메트릭
 * (예: kt_flow_errors) 값을 함께 참고할 것.
 */
export function buildK6ErrorThreadBlocks(scriptErrors) {
  const shown = scriptErrors.slice(0, 30);
  const lines = shown.map((e) => `• [${e.time}] ${e.message}`).join('\n') || '(상세 없음)';
  const more =
    scriptErrors.length > shown.length ? `\n... 외 ${scriptErrors.length - shown.length}건` : '';

  return {
    text: `k6 오류 상세 (${scriptErrors.length}건)`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*오류 상세 (${scriptErrors.length}건)*\n${lines}${more}` },
      },
    ],
  };
}