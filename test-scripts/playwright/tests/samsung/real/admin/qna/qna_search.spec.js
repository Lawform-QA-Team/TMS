import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/qna/qna_search.js';

test('samsung real admin - qna search', async ({ page }) => {
  await run(page);
}, 120000);
