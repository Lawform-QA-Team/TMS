import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/web/autodoc/autodoc_ai.js';

test('samsung real web - autodoc ai', async ({ page }) => {
  await run(page);
}, 300000);
