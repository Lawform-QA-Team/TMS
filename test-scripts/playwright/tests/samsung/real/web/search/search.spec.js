import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/web/search/search.js';

test('samsung real web - search', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
