import { test } from '@playwright/test';
import { SEAL_SCENARIOS } from '../../lawform/scenarios/seal.scenarios.js';
import { runLawformScenario } from './scenarioRunner.js';

test.describe.serial('LawForm SEAL 인감 관리', () => {
  for (const scenario of SEAL_SCENARIOS) {
    test(`${scenario.id}: ${scenario.name}`, async ({ page }) => {
      await runLawformScenario(page, scenario);
    });
  }
});
