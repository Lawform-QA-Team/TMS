import { test } from '@playwright/test';
import { TIMEOUT } from '/Users/ggpark/Desktop/git/TMS/test-scripts/playwright/common/constants.js';
import { run } from '/Users/ggpark/Desktop/git/TMS/test-scripts/playwright/lawform/web/clm/clm_draft.js';

test('lawform clm test', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
