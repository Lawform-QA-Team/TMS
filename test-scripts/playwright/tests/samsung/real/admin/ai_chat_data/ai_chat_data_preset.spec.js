import { test } from '@playwright/test';
import { TIMEOUT } from '../../../../../common/constants.js';
import { run } from '../../../../../samsung/real/admin/ai_chat_data/ai_chat_data_preset.js';

test('samsung real admin - ai chat data preset', async ({ page }) => {
  await run(page);
}, TIMEOUT.TEST);
