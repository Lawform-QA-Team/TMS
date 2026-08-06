import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/admin/dashboard/dashboard.js';

test('samsung real admin - dashboard', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
