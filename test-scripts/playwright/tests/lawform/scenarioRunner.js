export async function runLawformScenario(page, scenario) {
  const savedEnv = {};

  for (const [key, value] of Object.entries(scenario.env || {})) {
    savedEnv[key] = process.env[key];
    process.env[key] = value;
  }

  try {
    await scenario.run(page);
  } finally {
    for (const [key, original] of Object.entries(savedEnv)) {
      if (original === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original;
      }
    }
  }
}
