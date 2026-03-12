import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult  } from '@playwright/test/reporter';
import path from 'path';

type SlackMessageInput = {
    all: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: string;
    result?: string;
};

const getSlackMessage = ({
    all,
    passed,
    failed,
    skipped,
    duration,
    result,
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

    if (failed > 0 && result) {
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

class MyReporter implements Reporter {
    all = 0;
    passed = 0;
    failed = 0;
    skipped = 0;
    failMessages = '';
    private webhookUrl: string | undefined;

    constructor(options: { webhookUrl?: string } = {}) {
        this.webhookUrl = options.webhookUrl;
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
        const webhookUrl = this.webhookUrl || process.env.SLACK_WEBHOOK_URL;

        if (!webhookUrl) {
            console.error('SLACK_WEBHOOK_URL 환경 변수가 설정되지 않았습니다.');
            return;
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(blockKit),
            });

            if (!response.ok) {
                console.error('Slack 메시지 전송 실패:', response.statusText);
            } else {
                console.log('Slack 메시지 전송 성공');
            }
        } catch (error) {
            console.error('Slack 메시지 전송 중 에러 발생:', error);
        }
    }

    private addFailMessage(message: string) {
        this.failMessages += `\n${message}`;
    }

    private async getBlockKit(result: FullResult) {
        const { duration } = result;

        // 실패 메시지 최대 2000자로 제한
        const truncatedFailMessages = this.failMessages.length > 2000
            ? this.failMessages.slice(0, 2000) + '\n...(생략됨)'
            : this.failMessages;

        const resultBlockKit = getSlackMessage({
            all: this.all,
            passed: this.passed,
            failed: this.failed,
            skipped: this.skipped,
            duration: `${(duration / 1000).toFixed(1)}s`,
            result: truncatedFailMessages
                ? `통과하지 못한 테스트\n${truncatedFailMessages}`
                : `모든 테스트 통과!`,
        });

        return resultBlockKit;
    }
}

export default MyReporter;