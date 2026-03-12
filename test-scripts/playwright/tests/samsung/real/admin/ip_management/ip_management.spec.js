import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/ip_management/ip_management.js';

test('samsung real admin - ip management', async ({ page }) => {
  await run(page);
}, 300000);
