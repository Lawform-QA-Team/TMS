import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/web/autodoc/autodoc_temp.js';

test('samsung real web - autodoc temp', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
