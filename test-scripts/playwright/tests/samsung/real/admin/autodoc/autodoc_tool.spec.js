import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/autodoc/autodoc_tool.js';

test('samsung real admin - autodoc tool', async ({ page }) => {
  await run(page);
});
