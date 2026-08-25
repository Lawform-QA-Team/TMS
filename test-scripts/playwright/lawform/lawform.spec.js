/**
 * LawForm E2E 시나리오 통합 Spec
 *
 * 모든 시나리오는 순차 실행(serial)된다.
 * 각 시나리오의 env 필드는 test 실행 전 주입되고, 완료 후 복원된다.
 *
 * 실행:
 *   npx playwright test lawform/lawform.spec.js --config=lawform/playwright.lawform.config.js
 *
 * 특정 도메인만 실행:
 *   npx playwright test --grep "CLM"
 *   npx playwright test --grep "ADV"
 *   npx playwright test --grep "LIT"
 */
import { test } from '@playwright/test';
import { CLM_SCENARIOS }       from './scenarios/clm.scenarios.js';
import { ADVICE_SCENARIOS }    from './scenarios/advice.scenarios.js';
import { LITIGATION_SCENARIOS } from './scenarios/litigation.scenarios.js';
import { SEAL_SCENARIOS }      from './scenarios/seal.scenarios.js';
import { MISC_SCENARIOS }      from './scenarios/misc.scenarios.js';

/**
 * 시나리오 배열을 받아 test.describe.serial 블록을 생성한다.
 * env 주입 및 복원을 자동으로 처리한다.
 */
function registerScenarios(suiteName, scenarios) {
    test.describe.serial(suiteName, () => {
        let savedEnv = {};

        test.beforeEach(({ }, testInfo) => {
            // 현재 테스트의 시나리오 env 추출
            const scenario = scenarios.find(s => testInfo.title.startsWith(s.id));
            if (!scenario) return;

            // 기존 env 백업 후 주입
            savedEnv = {};
            for (const [key, value] of Object.entries(scenario.env)) {
                savedEnv[key] = process.env[key];
                process.env[key] = value;
            }
        });

        test.afterEach(() => {
            // env 복원 (undefined면 삭제)
            for (const [key, original] of Object.entries(savedEnv)) {
                if (original === undefined) {
                    delete process.env[key];
                } else {
                    process.env[key] = original;
                }
            }
            savedEnv = {};
        });

        for (const scenario of scenarios) {
            test(`${scenario.id}: ${scenario.name}`, async ({ page }) => {
                await scenario.run(page);
            });
        }
    });
}

// ── 시나리오 등록 ─────────────────────────────────────────────────────────
registerScenarios('CLM 계약 관리',  CLM_SCENARIOS);
registerScenarios('ADV 법률 자문',  ADVICE_SCENARIOS);
registerScenarios('LIT 송무 관리',  LITIGATION_SCENARIOS);
registerScenarios('SEAL 인감 관리', SEAL_SCENARIOS);
registerScenarios('MISC 공통 기능', MISC_SCENARIOS);
