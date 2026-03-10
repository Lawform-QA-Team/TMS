import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/login/logout.js';

test('samsung real admin - logout', async ({ page }) => {
  await run(page);
});
