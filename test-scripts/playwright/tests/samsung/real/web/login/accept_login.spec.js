import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/web/login/accept_login.js';

test('samsung real web - accept login', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
