import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/admin/members/members_service.js';

test('samsung real admin - members service', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
