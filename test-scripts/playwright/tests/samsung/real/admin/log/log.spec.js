import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/admin/log/log.js';

test('samsung real admin - log', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
