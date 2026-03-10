import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/web/autodoc/autodoc_temp.js';

test('samsung real web - autodoc temp', async ({ page }) => {
  await run(page);
});
