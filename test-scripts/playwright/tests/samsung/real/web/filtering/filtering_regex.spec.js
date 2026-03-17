import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/web/filtering/filtering_regex.js';

test('samsung real web - filtering regex', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
