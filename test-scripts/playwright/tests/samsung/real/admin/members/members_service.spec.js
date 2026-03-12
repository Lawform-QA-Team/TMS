import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/members/members_service.js';

test('samsung real admin - members service', async ({ page }) => {
  await run(page);
}, 120000);
