import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import path from 'path';

const SLACK_API_URL = 'https://slack.com/api/chat.postMessage';

type SlackMessageInput = {
    all: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: string;
    /** 메인 메시지에 실패 상세 포함 여부 (false면 스레드로만 전송) */
    includeFailureDetail?: boolean;
    result?: string;
};

/** 실패한 테스트 한 건의 상세 정보 (스레드용) */
type FailEntry = {
    title: string;
    fileName: string;
    line: number;
    column: number;
    duration: string;
    /** 에러 메시지 (Call log 포함될 수 있음, ANSI 제거) */
    errorMessage?: string;
    /** 코드 스니펫 (어느 라인에서 실패했는지, ANSI 제거) */
    errorSnippet?: string;
    /** 스택 트레이스만 (에러 메시지와 중복 제거, ANSI 제거) */
    errorStack?: string;
    /** 첨부 파일 경로 목록 */
    attachmentLines?: string[];
};

/** ANSI 컬러 코드 제거 (예: \x1B[31m 또는 리터럴 [31m) */
function stripAnsi(input?: string): string | undefined {
    if (!input) return input;
    let s = input;
    // 실제 ESC 시퀀스 (\x1B[...m)
    s = s.replace(/\x1B\[[0-9;]*m/g, '');
    // 리터럴 [숫자m 형태 (문자열로 들어오는 경우)
    s = s.replace(/\[[0-9;]+m/g, '');
    return s.trim();
}

const SLACK_BLOCK_TEXT_MAX = 2900;

/** 에러 객체를 메시지 / 스니펫 / 스택으로 분리 (중복 제거) */
function parseError(error: TestResult['error']): {
    message: string | undefined;
    snippet: string | undefined;
    stack: string | undefined;
} {
    if (!error) return { message: undefined, snippet: undefined, stack: undefined };
    const anyErr = error as { message?: string; stack?: string; snippet?: string };
    const message = stripAnsi(anyErr.message);
    const rawStack = stripAnsi(anyErr.stack);
    const snippet = stripAnsi(anyErr.snippet);

    // stack에 message가 앞에 포함된 경우 제거 (중복 방지)
    let stack: string | undefined;
    if (rawStack) {
        const msgFirstLine = message?.split('\n')[0]?.trim();
        if (msgFirstLine && rawStack.startsWith(msgFirstLine)) {
            const after = rawStack.slice(msgFirstLine.length).replace(/^\n+/, '').trim();
            stack = after || undefined;
        } else {
            stack = rawStack;
        }
    }

    return { message: message || undefined, snippet: snippet || undefined, stack };
}

const getSlackMessage = ({
    all,
    passed,
    failed,
    skipped,
    duration,
    result,
    includeFailureDetail = false,
}: SlackMessageInput) => {
    const color = failed > 0 ? '#ff0000' : '#36a64f';
    const statusEmoji = failed > 0 ? '❌' : '✅';
    const passRate = all > 0 ? ((passed / all) * 100).toFixed(1) : '0.0';

    const blocks: any[] = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `${statusEmoji} Playwright Test Report`,
            },
        },
        {
            type: 'section',
            fields: [
                {
                    type: 'mrkdwn',
                    text: `*총 테스트 수:*\n${all}개`,
                },
                {
                    type: 'mrkdwn',
                    text: `*Pass Rate:*\n${passRate}%`,
                },
            ],
        },
        {
            type: 'section',
            fields: [
                {
                    type: 'mrkdwn',
                    text: `*✅ 통과:*\n${passed}개`,
                },
                {
                    type: 'mrkdwn',
                    text: `*❌ 실패:*\n${failed}개`,
                },
                {
                    type: 'mrkdwn',
                    text: `*⚠️ 스킵:*\n${skipped}개`,
                },
            ],
        },
        {
            type: 'section',
            fields: [
                {
                    type: 'mrkdwn',
                    text: `*실행 시간:*\n${duration}`,
                },
            ],
        },
    ];

    if (failed > 0 && includeFailureDetail && result) {
        // Slack blocks text 최대 3000자 제한
        const truncatedResult = result.length > 2800
            ? result.slice(0, 2800) + '\n...(생략됨)'
            : result;

        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*실패한 테스트 상세:*\n\`\`\`${truncatedResult}\`\`\``,
            },
        });
    } else if (failed > 0 && !includeFailureDetail) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*실패한 테스트 상세는 아래 스레드를 확인하세요.* (${failed}건)`,
            },
        });
    } else if (failed === 0) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: '*🎉 모든 테스트가 통과했습니다!*',
            },
        });
    }

    return {
        attachments: [
            {
                color,
                blocks,
            },
        ],
    };
};

/** 스레드용 블록: 실패 한 건의 상세 에러 (메시지 / 코드 위치 / 스택 구분, ANSI 제거) */
function buildThreadBlocks(entry: FailEntry): any[] {
    const location = `${entry.fileName}:${entry.line}:${entry.column}`;
    const blocks: any[] = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `❌ ${entry.title}`,
                emoji: true,
            },
        },
        {
            type: 'section',
            fields: [
                { type: 'mrkdwn', text: `*위치:*\n\`${location}\`` },
                { type: 'mrkdwn', text: `*소요:*\n${entry.duration}` },
            ],
        },
    ];

    const truncate = (s: string) =>
        s.length > SLACK_BLOCK_TEXT_MAX ? s.slice(0, SLACK_BLOCK_TEXT_MAX) + '\n...(생략됨)' : s;

    if (entry.errorMessage) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*에러 메시지:*\n\`\`\`${truncate(entry.errorMessage)}\`\`\``,
            },
        });
    }
    if (entry.errorSnippet) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*코드 위치:*\n\`\`\`${truncate(entry.errorSnippet)}\`\`\``,
            },
        });
    }
    if (entry.errorStack) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*스택:*\n\`\`\`${truncate(entry.errorStack)}\`\`\``,
            },
        });
    }
    if (entry.attachmentLines && entry.attachmentLines.length > 0) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*첨부:*\n\`\`\`${truncate(entry.attachmentLines.join('\n'))}\`\`\``,
            },
        });
    }
    return blocks;
}

/** 테스트 한 건의 마지막 실행 결과 (retry 제외용) */
type LastResult = {
    status: TestResult['status'];
    duration: number;
    error?: TestResult['error'];
    attachments?: TestResult['attachments'];
};

class MyReporter implements Reporter {
    all = 0;
    passed = 0;
    failed = 0;
    skipped = 0;
    failMessages = '';
    /** 테스트별 마지막 결과만 유지 (retry 제외) */
    private lastResultByTest = new Map<string, LastResult & { test: TestCase }>();
    /** 스레드 전송용 실패 상세 목록 (onEnd에서 lastResultByTest 기반으로 생성) */
    private failEntries: FailEntry[] = [];
    private token: string | undefined;
    private channel: string | undefined;

    constructor(options: { webhookUrl?: string; token?: string; channel?: string } = {}) {
        this.token = options.token ?? process.env.SLACK_BOT_TOKEN;
        this.channel = options.channel ?? process.env.SLACK_CHANNEL_ID;
    }

    onBegin(_: FullConfig, suite: Suite) {
        this.all = suite.allTests().length;
    }

    onTestEnd(test: TestCase, result: TestResult) {
        const key = test.id ?? `${test.location.file}:${test.location.line}:${test.title}`;
        this.lastResultByTest.set(key, {
            status: result.status,
            duration: result.duration,
            error: result.error,
            attachments: result.attachments,
            test,
        });
    }

    /** 마지막 결과만 기준으로 집계 및 failEntries 생성 (retry 제외) */
    private applyFinalResults() {
        this.passed = 0;
        this.failed = 0;
        this.skipped = 0;
        this.failMessages = '';
        this.failEntries = [];

        for (const { status, duration, error, attachments, test } of this.lastResultByTest.values()) {
            const testDuration = `${(duration / 1000).toFixed(1)}s`;
            const fileName = path.basename(test.location.file);
            const testTitle = test.title;

            switch (status) {
                case 'failed':
                case 'timedOut':
                    this.addFailMessage(
                        `❌ ${fileName}:${test.location.line}:${test.location.column} > ${testTitle} ${testDuration}`,
                    );
                    const { message: errMsg, snippet: errSnippet, stack: errStack } = parseError(error);
                    const attachmentLines: string[] = [];
                    if (attachments && attachments.length > 0) {
                        for (const att of attachments as any[]) {
                            if (!att?.path) continue;
                            const name = att.name || att.contentType || 'attachment';
                            attachmentLines.push(`${name}: ${att.path}`);
                        }
                    }
                    this.failEntries.push({
                        title: testTitle,
                        fileName,
                        line: test.location.line,
                        column: test.location.column,
                        duration: testDuration,
                        errorMessage: errMsg,
                        errorSnippet: errSnippet,
                        errorStack: errStack,
                        attachmentLines: attachmentLines.length > 0 ? attachmentLines : undefined,
                    });
                    this.failed += 1;
                    break;
                case 'skipped':
                    this.addFailMessage(
                        `⚠️ ${fileName}:${test.location.line}:${test.location.column} > ${testTitle} ${testDuration}`,
                    );
                    this.skipped += 1;
                    break;
                case 'passed':
                    this.passed += 1;
                    break;
                default:
                    break;
            }
        }
    }

    async onEnd(result: FullResult) {
        this.applyFinalResults();

        const blockKit = await this.getBlockKit(result);
        const token = this.token;
        const channel = this.channel;

        if (!token || !channel) {
            console.error('SLACK_BOT_TOKEN, SLACK_CHANNEL_ID 환경 변수를 설정해주세요.');
            return;
        }

        const ts = await this.postMessage(token, channel, blockKit);
        if (ts === null) return;

        // 실패한 테스트마다 스레드로 상세 에러 전송
        for (const entry of this.failEntries) {
            await this.postMessage(token, channel, {
                attachments: [
                    {
                        color: '#ff0000',
                        blocks: buildThreadBlocks(entry),
                    },
                ],
            }, ts);
        }
    }

    /** Slack Bot API로 메시지 전송. thread_ts 있으면 해당 스레드에 답글. 반환: 메시지 ts 또는 null */
    private async postMessage(
        token: string,
        channel: string,
        payload: { attachments?: any[] },
        threadTs?: string,
    ): Promise<string | null> {
        try {
            const body: Record<string, unknown> = {
                channel,
                ...payload,
            };
            if (threadTs) body.thread_ts = threadTs;

            const response = await fetch(SLACK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const json = (await response.json()) as { ok: boolean; ts?: string; error?: string };

            if (!json.ok) {
                console.error('Slack 메시지 전송 실패:', json.error);
                return null;
            }
            return json.ts ?? null;
        } catch (error) {
            console.error('Slack 메시지 전송 중 에러 발생:', error);
            return null;
        }
    }

    private addFailMessage(message: string) {
        this.failMessages += `\n${message}`;
    }

    private async getBlockKit(result: FullResult) {
        const { duration } = result;

        // 실패 메시지 최대 2000자로 제한 (메인 메시지용 요약; 상세는 스레드로 전송)
        const truncatedFailMessages = this.failMessages.length > 2000
            ? this.failMessages.slice(0, 2000) + '\n...(생략됨)'
            : this.failMessages;

        const resultBlockKit = getSlackMessage({
            all: this.all,
            passed: this.passed,
            failed: this.failed,
            skipped: this.skipped,
            duration: `${(duration / 1000).toFixed(1)}s`,
            includeFailureDetail: false,
            result: truncatedFailMessages
                ? `통과하지 못한 테스트\n${truncatedFailMessages}`
                : `모든 테스트 통과!`,
        });

        return resultBlockKit;
    }
}

export default MyReporter;