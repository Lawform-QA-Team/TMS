import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/web/autodoc/autodoc_existing.js';

test('samsung real web - autodoc existing', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
