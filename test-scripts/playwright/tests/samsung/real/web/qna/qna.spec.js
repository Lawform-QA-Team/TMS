import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/web/qna/qna.js';

test('samsung real web - qna', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
