import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/admin/ip_management/ip_management.js';

test('samsung real admin - ip management', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
