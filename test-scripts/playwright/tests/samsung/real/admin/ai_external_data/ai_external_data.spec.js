import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/ai_external_data/ai_external_data.js';

test('samsung real admin - ai external data', async ({ page }) => {
  await run(page);
}, 120000);
