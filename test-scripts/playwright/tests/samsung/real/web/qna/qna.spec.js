import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/web/qna/qna.js';

test('samsung real web - qna', async ({ page }) => {
  await run(page);
}, 300000);
