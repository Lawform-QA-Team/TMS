import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/web/login/accept_login.js';

test('samsung real web - accept login', async ({ page }) => {
  await run(page);
});
