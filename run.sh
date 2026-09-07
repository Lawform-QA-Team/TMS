#!/bin/bash
set -a
source test-scripts/performance/.env
set +a

SCRIPT="$1"
TMPFILE=$(mktemp /tmp/k6_XXXXXX)       # macOS mktemp: X는 반드시 맨 끝
METRICSFILE=$(mktemp /tmp/k6_met_XXXXXX)  # handleSummary가 기록할 메트릭 JSON

export _K6_SCRIPT="$SCRIPT"
export _K6_TMPFILE="$TMPFILE"
export _K6_METRICS_FILE="$METRICSFILE"
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
        # OSError break 시 exit_code=1(초기값) 상태일 수 있음 → k6 실제 종료 코드 획득
        if exit_code not in (130,):
            try:
                _, final_status = os.waitpid(pid, 0)
                exit_code = os.WEXITSTATUS(final_status) if os.WIFEXITED(final_status) else exit_code
            except ChildProcessError:
                pass  # 이미 waitpid로 수집된 경우

    # ANSI 제거 후 \r을 \n으로 변환, ERRO 라인만 추출해 파일에 저장
    clean = ANSI_RE.sub(b'', bytes(captured))
    lines = re.split(rb'\r\n|\r|\n', clean)
    erro_lines = [l.decode('utf-8', errors='replace') for l in lines if l.startswith(b'ERRO')]

    with open(os.environ['_K6_TMPFILE'], 'w') as f:
        f.write('\n'.join(erro_lines))

    sys.exit(exit_code)
PYEOF
K6_EXIT_CODE=$?

SCRIPT_NAME=$(basename "$SCRIPT" .js)
export _K6_SCRIPT_NAME="$SCRIPT_NAME"
export _K6_EXIT_CODE="$K6_EXIT_CODE"

# Slack 통합 발송: handleSummary가 기록한 메트릭 JSON + ERRO 라인 합쳐 한 번만 발송
if [ -n "${SLACK_BOT_TOKEN:-}" ] && [ -n "${SLACK_CHANNEL_ID:-}" ] && [ "$K6_EXIT_CODE" -ne 130 ]; then
    python3 << 'PYEOF'
import json, os, sys, urllib.request, urllib.error

script_name = os.environ.get('_K6_SCRIPT_NAME', 'unknown')
exit_code   = int(os.environ.get('_K6_EXIT_CODE', '0'))
token       = os.environ.get('SLACK_BOT_TOKEN', '')
channel     = os.environ.get('SLACK_CHANNEL_ID', '')
tmpfile     = os.environ.get('_K6_TMPFILE', '')
metrics_file = os.environ.get('_K6_METRICS_FILE', '')

# ERRO 라인 읽기
erro_lines = []
try:
    with open(tmpfile) as f:
        erro_lines = [l for l in f.read().splitlines() if l.startswith('ERRO')]
except Exception:
    pass

# handleSummary가 기록한 메트릭 JSON 읽기
summary = None
if metrics_file:
    try:
        with open(metrics_file) as f:
            content = f.read().strip()
            if content:
                summary = json.loads(content)
    except Exception:
        pass

# 메인 payload 결정
script_errors = []
if summary:
    payload      = summary.get('payload', {})
    script_errors = summary.get('scriptErrors', [])
else:
    # handleSummary 미호출 (비정상 종료)
    payload = {
        'text': f'[k6] {script_name}: 실행 실패',
        'attachments': [{'color': '#ff0000', 'blocks': [
            {'type': 'header', 'text': {'type': 'plain_text', 'text': f'\u274c k6 실행 실패: {script_name}', 'emoji': True}},
            {'type': 'section', 'text': {'type': 'mrkdwn', 'text': f'*비정상 종료 (exit code: {exit_code})*\nhandleSummary 미호출'}},
        ]}],
    }

# ERRO 발생 시 실패로 처리 + ERRO 블록 추가
if erro_lines:
    payload['text'] = payload.get('text', '').replace(': 성공', ': 실패')
    for att in payload.get('attachments', []):
        att['color'] = '#ff0000'
        for block in att.get('blocks', []):
            if block.get('type') == 'header':
                t = block.get('text', {})
                t['text'] = t.get('text', '').replace('✅', '❌')
            if block.get('type') == 'section':
                for field in block.get('fields', []):
                    if field.get('text', '').startswith('*상태:*'):
                        field['text'] = '*상태:*\n실패'
        att['blocks'] = [
            b for b in att.get('blocks', [])
            if not (b.get('type') == 'section' and
                    b.get('text', {}).get('text', '') == '*대상 페이지 성능 측정 완료!*')
        ]
    erro_text = '\n'.join(erro_lines[:15])
    if payload.get('attachments'):
        payload['attachments'][0].setdefault('blocks', []).extend([
            {'type': 'divider'},
            {'type': 'section', 'text': {
                'type': 'mrkdwn',
                'text': f'*\u26a0\ufe0f CDP 런타임 오류 ({len(erro_lines)}건):*\n```{erro_text}```',
            }},
        ])

def post_slack(payload_dict, thread_ts=None):
    body = {'channel': channel, **payload_dict}
    if thread_ts:
        body['thread_ts'] = thread_ts
    req = urllib.request.Request(
        'https://slack.com/api/chat.postMessage',
        data=json.dumps(body, ensure_ascii=False).encode(),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            if not result.get('ok'):
                print(f'[Slack] 발송 실패: {result.get("error")}', file=sys.stderr)
                return None
            return result.get('ts')
    except Exception as e:
        print(f'[Slack] 요청 실패: {e}', file=sys.stderr)
        return None

# 메인 메시지 발송
ts = post_slack(payload)

# script_errors 스레드 발송
if ts and script_errors:
    err_blocks = [
        {'type': 'header', 'text': {'type': 'plain_text', 'text': f'\u274c 오류 상세 ({len(script_errors)}건)', 'emoji': True}},
    ]
    for err in script_errors:
        if err.get('message'):
            err_blocks.append({'type': 'section', 'text': {
                'type': 'mrkdwn',
                'text': f'*에러 메시지:*\n```{str(err["message"])[:2900]}```',
            }})
        if err.get('stack'):
            err_blocks.append({'type': 'section', 'text': {
                'type': 'mrkdwn',
                'text': f'*스택:*\n```{str(err["stack"])[:2900]}```',
            }})
        if err.get('time'):
            err_blocks.append({'type': 'context', 'elements': [
                {'type': 'mrkdwn', 'text': f'발생 시각: {err["time"]}'},
            ]})
        err_blocks.append({'type': 'divider'})
    post_slack({'text': '오류 상세', 'attachments': [{'color': '#ff0000', 'blocks': err_blocks}]}, ts)
PYEOF
fi

rm -f "$TMPFILE" "$METRICSFILE"
exit $K6_EXIT_CODE
