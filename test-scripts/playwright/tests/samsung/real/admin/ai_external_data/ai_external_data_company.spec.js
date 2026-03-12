import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/admin/ai_external_data/ai_external_data_company.js';

test('samsung real admin - ai external data company', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
