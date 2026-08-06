import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/lib/jiraClient.ts',
        'src/lib/jiraPipeline.ts',
        'src/lib/executionEngine.ts',
        'src/lib/socketServer.ts',
        'src/lib/redis.ts',
        'src/routes/jira.ts',
        'src/routes/notifications.ts',
        'src/routes/schedules.ts',
        'src/routes/cicd.ts',
        'src/routes/settings.ts',
        'src/routes/testData.ts',
        'src/routes/testScripts.ts',
        'src/routes/collaboration.ts',
        'src/routes/dependencies.ts',
        'src/routes/automation.ts',
        'src/routes/performance.ts',
      ],
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': '/Users/ggpark/orca/workspaces/TMS/add-jira_automation/server/src',
    },
  },
})
