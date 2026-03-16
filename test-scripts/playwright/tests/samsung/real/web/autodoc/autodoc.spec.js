import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/web/autodoc/autodoc.js';

test('samsung real web - autodoc', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST_LONG);
