import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/dashboard/dashboard.js';

test('samsung real admin - dashboard', async ({ page }) => {
  await run(page);
});
