import { test } from '@playwright/test';
import { LITIGATION_SCENARIOS } from '../../lawform/scenarios/litigation.scenarios.js';
import { runLawformScenario } from './scenarioRunner.js';

test.describe.serial('LawForm LIT 송무 관리', () => {
  for (const scenario of LITIGATION_SCENARIOS) {
    test(`${scenario.id}: ${scenario.name}`, async ({ page }) => {
      await runLawformScenario(page, scenario);
    });
  }
});
