import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/web/notice/notice.js';

test('samsung real web - notice', async ({ page }) => {
  await run(page);
});
