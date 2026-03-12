import { test } from '@playwright/test';
import { run } from '../../../../../samsung/real/admin/ai_chat_data/ai_chat_data.js';

test('samsung real admin - ai chat data', async ({ page }) => {
  await run(page);
}, 300000);
