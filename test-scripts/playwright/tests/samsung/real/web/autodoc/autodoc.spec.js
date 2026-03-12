import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/web/autodoc/autodoc.js';

test('samsung real web - autodoc', async ({ page }) => {
  await run(page);
}, 120000);
