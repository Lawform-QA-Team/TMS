import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/admin/document_update_report/document_update_report_other.js';

test('samsung real admin - document update report other', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
