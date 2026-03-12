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
    errorMessage?: string;
    errorStack?: string;
};

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
                    text: `*실행 시간:*\n${duration}`,
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

/** 스레드용 블록: 실패 한 건의 상세 에러 */
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
    if (entry.errorMessage) {
        const msg = entry.errorMessage.length > 2900
            ? entry.errorMessage.slice(0, 2900) + '\n...(생략됨)'
            : entry.errorMessage;
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*에러 메시지:*\n\`\`\`${msg}\`\`\``,
            },
        });
    }
    if (entry.errorStack) {
        const stack = entry.errorStack.length > 2900
            ? entry.errorStack.slice(0, 2900) + '\n...(생략됨)'
            : entry.errorStack;
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*스택:*\n\`\`\`${stack}\`\`\``,
            },
        });
    }
    return blocks;
}

class MyReporter implements Reporter {
    all = 0;
    passed = 0;
    failed = 0;
    skipped = 0;
    failMessages = '';
    /** 스레드 전송용 실패 상세 목록 */
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
        const testDuration = `${(result.duration / 1000).toFixed(1)}s`;
        const fileName = path.basename(test.location.file);
        const testTitle = test.title;

        switch (result.status) {
            case 'failed':
            case 'timedOut':
                this.addFailMessage(
                    `❌ ${fileName}:${test.location.line}:${test.location.column} > ${testTitle} ${testDuration}`,
                );
                this.failEntries.push({
                    title: testTitle,
                    fileName,
                    line: test.location.line,
                    column: test.location.column,
                    duration: testDuration,
                    errorMessage: result.error?.message,
                    errorStack: result.error?.stack,
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

    async onEnd(result: FullResult) {
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