import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/admin/login/login_to_web.js';

test('samsung real admin - login to web', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
