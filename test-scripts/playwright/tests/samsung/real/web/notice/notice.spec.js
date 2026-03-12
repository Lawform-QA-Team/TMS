import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/web/notice/notice.js';

test('samsung real web - notice', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
