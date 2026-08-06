#!/bin/bash
set -a
source test-scripts/performance/.env
set +a

SCRIPT="$1"
TMPFILE=$(mktemp /tmp/k6_XXXXXX)  # macOS mktemp: X는 반드시 맨 끝

export _K6_SCRIPT="$SCRIPT"
export _K6_TMPFILE="$TMPFILE"
export _K6_OUT="xk6-influxdb=${K6_INFLUXDB_ADDR}"

# Python pty.fork()로 k6 실행:
#   - PTY 제공 → INFO[XXXX] 포맷 + 인플레이스 progress bar 유지
#   - stdin 모니터링 없음 → k6 종료 즉시 반환
#   - ERRO 라인 추출은 Python에서 직접 처리 (shell sed보다 포괄적 ANSI 제거)
python3 << 'PYEOF'
import pty, os, sys, select, re

# 포괄적 ANSI 이스케이프 시퀀스 제거 (CSI, OSC, 기타 ESC 시퀀스 포함)
ANSI_RE = re.compile(rb'\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07]*\x07)')

captured = bytearray()

pid, master_fd = pty.fork()

if pid == 0:
    # 자식: k6 실행
    os.execv('./k6', ['./k6', 'run', '--out', os.environ['_K6_OUT'], os.environ['_K6_SCRIPT']])
else:
    # 부모: master PTY에서 읽어 터미널 출력 + 캡처
    exit_code = 1
    try:
        while True:
            try:
                rfds, _, _ = select.select([master_fd], [], [], 0.5)
            except (KeyboardInterrupt, OSError):
                break

            if rfds:
                try:
                    data = os.read(master_fd, 4096)
                    if not data:
                        break
                    captured.extend(data)
                    os.write(sys.stdout.fileno(), data)
                except OSError:
                    break

            # k6 종료 확인 (non-blocking)
            result = os.waitpid(pid, os.WNOHANG)
            if result[0] != 0:
                # 종료됨 - 남은 데이터 flush
                while True:
                    try:
                        rfds, _, _ = select.select([master_fd], [], [], 0.2)
                        if not rfds:
                            break
                        data = os.read(master_fd, 4096)
                        if not data:
                            break
                        captured.extend(data)
                        os.write(sys.stdout.fileno(), data)
                    except OSError:
                        break
                status = result[1]
                exit_code = os.WEXITSTATUS(status) if os.WIFEXITED(status) else 1
                break
    except KeyboardInterrupt:
        exit_code = 130
    finally:
        try:
            os.close(master_fd)
        except OSError:
            pass

    # ANSI 제거 후 \r을 \n으로 변환, ERRO 라인만 추출해 파일에 저장
    clean = ANSI_RE.sub(b'', bytes(captured))
    lines = re.split(rb'\r\n|\r|\n', clean)
    erro_lines = [l.decode('utf-8', errors='replace') for l in lines if l.startswith(b'ERRO')]

    with open(os.environ['_K6_TMPFILE'], 'w') as f:
        f.write('\n'.join(erro_lines))

    sys.exit(exit_code)
PYEOF
K6_EXIT_CODE=$?

ERRO_LINES=$(cat "$TMPFILE")

if ([ "$K6_EXIT_CODE" -ne 0 ] && [ "$K6_EXIT_CODE" -ne 130 ]) || [ -n "$ERRO_LINES" ]; then
    if [ -n "${SLACK_BOT_TOKEN:-}" ] && [ -n "${SLACK_CHANNEL_ID:-}" ]; then
        SCRIPT_NAME=$(basename "$SCRIPT" .js)
        export _K6_SCRIPT_NAME="$SCRIPT_NAME"
        export _K6_EXIT_CODE="$K6_EXIT_CODE"
        export _K6_ERRO_LINES="$ERRO_LINES"

        PAYLOAD=$(python3 << 'PYEOF'
import json, os

script_name = os.environ['_K6_SCRIPT_NAME']
exit_code = int(os.environ['_K6_EXIT_CODE'])
erro_raw = os.environ.get('_K6_ERRO_LINES', '')
erro_lines = [l for l in erro_raw.splitlines() if l.startswith('ERRO')]
erro_detail = '\n'.join(erro_lines[:15]) if erro_lines else '(ERRO 로그 없음 - 종료 코드 비정상)'

blocks = [
    {
        'type': 'header',
        'text': {'type': 'plain_text', 'text': f':warning: k6 런타임 오류: {script_name}', 'emoji': True},
    },
    {
        'type': 'section',
        'fields': [
            {'type': 'mrkdwn', 'text': f'*종료 코드:*\n{exit_code}'},
            {'type': 'mrkdwn', 'text': f'*오류 수:*\n{len(erro_lines)}건'},
        ],
    },
    {
        'type': 'section',
        'text': {'type': 'mrkdwn', 'text': f'*오류 상세:*\n```{erro_detail}```'},
    },
]

payload = {
    'channel': os.environ.get('SLACK_CHANNEL_ID', ''),
    'text': f'[k6] {script_name}: 런타임 오류',
    'attachments': [{'color': '#ff9900', 'blocks': blocks}],
}
print(json.dumps(payload, ensure_ascii=False))
PYEOF
)
        curl -s -X POST \
            -H 'Content-type: application/json' \
            -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
            --data "$PAYLOAD" \
            "https://slack.com/api/chat.postMessage" > /dev/null
    fi
fi

rm -f "$TMPFILE"
exit $K6_EXIT_CODE
