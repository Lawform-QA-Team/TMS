import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/autodoc/autodoc_category.js';

test('samsung real admin - autodoc category', async ({ page }) => {
  await run(page);
}, 120000);
