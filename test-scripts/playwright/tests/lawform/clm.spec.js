import { test } from '@playwright/test';
import { CLM_SCENARIOS } from '../../lawform/scenarios/clm.scenarios.js';
import { runLawformScenario } from './scenarioRunner.js';

test.describe.serial('LawForm CLM 계약 관리', () => {
  for (const scenario of CLM_SCENARIOS) {
    test(`${scenario.id}: ${scenario.name}`, async ({ page }) => {
      await runLawformScenario(page, scenario);
    });
  }
});
