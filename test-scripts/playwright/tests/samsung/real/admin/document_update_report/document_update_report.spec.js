import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/document_update_report/document_update_report.js';

test('samsung real admin - document update report', async ({ page }) => {
  await run(page);
});
