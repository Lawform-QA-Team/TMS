import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/admin/login/logout.js';

test('samsung real admin - logout', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
