import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/web/autodoc/autodoc_existing.js';

test('samsung real web - autodoc existing', async ({ page }) => {
  await run(page);
});
