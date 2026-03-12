import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/filtering/filtering.js';

test('samsung real admin - filtering', async ({ page }) => {
  await run(page);
}, 120000);
