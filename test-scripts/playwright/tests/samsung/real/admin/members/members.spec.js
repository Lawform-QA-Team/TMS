import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/members/members.js';

test('samsung real admin - members', async ({ page }) => {
  await run(page);
});
