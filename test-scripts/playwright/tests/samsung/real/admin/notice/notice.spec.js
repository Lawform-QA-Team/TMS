import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/notice/notice.js';

test('samsung real admin - notice', async ({ page }) => {
  await run(page);
});
