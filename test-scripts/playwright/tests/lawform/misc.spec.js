import { test } from '@playwright/test';
import { MISC_SCENARIOS } from '../../lawform/scenarios/misc.scenarios.js';
import { runLawformScenario } from './scenarioRunner.js';

test.describe.serial('LawForm MISC 공통 기능', () => {
  for (const scenario of MISC_SCENARIOS) {
    test(`${scenario.id}: ${scenario.name}`, async ({ page }) => {
      await runLawformScenario(page, scenario);
    });
  }
});
