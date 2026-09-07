import { test } from '@playwright/test';
import { ADVICE_SCENARIOS } from '../../lawform/scenarios/advice.scenarios.js';
import { runLawformScenario } from './scenarioRunner.js';

test.describe.serial('LawForm ADV 법률 자문', () => {
  for (const scenario of ADVICE_SCENARIOS) {
    test(`${scenario.id}: ${scenario.name}`, async ({ page }) => {
      await runLawformScenario(page, scenario);
    });
  }
});
