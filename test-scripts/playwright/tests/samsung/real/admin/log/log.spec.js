import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/log/log.js';

test('samsung real admin - log', async ({ page }) => {
  await run(page);
});
