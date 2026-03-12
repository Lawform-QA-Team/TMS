import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/admin/autodoc/autodoc.js';

test('samsung real admin - autodoc', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
