import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/login/login_to_web.js';

test('samsung real admin - login to web', async ({ page }) => {
  await run(page);
});
