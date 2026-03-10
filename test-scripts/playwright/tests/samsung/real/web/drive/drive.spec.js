import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/web/drive/drive.js';

test('samsung real web - drive', async ({ page }) => {
  await run(page);
});
