import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/service_terms/service_terms_terms.js';

test('samsung real admin - service terms terms', async ({ page }) => {
  await run(page);
});
