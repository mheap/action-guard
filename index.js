module.exports = (guards) => {
  if (!Array.isArray(guards)) {
    guards = [guards];
  }
  let prefix = "";

  // Make sure we have the required ENV parameters
  const requiredEnv = ["GITHUB_EVENT_NAME", "GITHUB_EVENT_PATH"];

  for (let name of requiredEnv) {
    if (!process.env[name]) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  const results = [];
  for (let guard of guards) {
    results.push(runSingle(guard));
  }

  const failed = results.filter((r) => r.success === false);

  if (failed.length === results.length) {
    const errors = failed.map((r) => r.reason).join("\n");

    // If we're checking multiple guards, add a prefix
    if (guards.length > 1) {
      prefix = "Expected at least one to pass, but all guards failed:\n\n";
    }
    throw new Error(`${prefix}${errors}`);
  }
};

function runSingle(params) {
  if (!params.event) {
    params = { event: params };
  }
  let expectedEventName = params.event;
  // Save the event name and payload
  const event = process.env.GITHUB_EVENT_NAME;
  const payload = require(process.env.GITHUB_EVENT_PATH);

  // Check that the provided event matches what we're expecting
  let [expectedEvent, expectedAction] = expectedEventName.split(".", 2);
  if (event !== expectedEvent) {
    return {
      success: false,
      reason: `Invalid event. Expected '${expectedEvent}', got '${event}'`,
    };
  }

  if (expectedAction && payload.action !== expectedAction) {
    return {
      success: false,
      reason: `Invalid event. Expected '${expectedEvent}.${expectedAction}', got '${event}.${payload.action}'`,
    };
  }

  return { success: true };
}
