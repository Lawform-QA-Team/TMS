import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/autodoc/autodoc.js';

test('samsung real admin - autodoc', async ({ page }) => {
  await run(page);
});
