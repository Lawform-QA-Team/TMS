import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/service_terms/service_terms.js';

test('samsung real admin - service terms', async ({ page }) => {
  await run(page);
});
