import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/web/search/search.js';

test('samsung real web - search', async ({ page }) => {
  await run(page);
});
