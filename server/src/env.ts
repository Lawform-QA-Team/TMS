import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8000),

  // Database
  DATABASE_URL: z.string().min(1),

  // Auth
  JWT_SECRET_KEY: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Jira
  JIRA_SERVER_URL: z.string().optional(),
  JIRA_USERNAME: z.string().optional(),
  JIRA_API_TOKEN: z.string().optional(),
  JIRA_PROJECT_KEY: z.string().default('TEST'),
  JIRA_WEBHOOK_SECRET: z.string().optional(),
  JIRA_WATCHED_PROJECTS: z.string().default('').transform((v) => v.split(',').filter(Boolean)),
  QUEUE_NAME: z.string().default('jira-pipeline'),
  JIRA_CRON_ENABLED: z.string().default('false').transform((v) => v === 'true'),
  JIRA_CRON_JQL: z.string().optional(),

  // LLM
  ANTHROPIC_API_KEY: z.string().optional(),

  // Slack
  SLACK_WEBHOOK_URL: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_CHANNEL_ID: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z
    .string()
    .default('*')
    .transform((v) => (v === '*' ? ['*'] : v.split(','))),
})

function loadEnv() {
  // .env 파일 로드 (Node.js v20.12+), 프로덕션은 환경 변수 직접 주입
  try { process.loadEnvFile('.env') } catch { /* .env 없거나 이미 로드됨 */ }
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`환경 변수 설정 오류:\n${missing}`)
  }
  return result.data
}

export const env = loadEnv()
export type Env = typeof env
