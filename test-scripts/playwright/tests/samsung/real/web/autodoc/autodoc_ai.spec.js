import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/web/autodoc/autodoc_ai.js';

test('samsung real web - autodoc ai', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
