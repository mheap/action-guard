module.exports = (guards) => {
  if (!Array.isArray(guards)) {
    guards = [guards];
  }
  let prefix = "";

  return new Promise(async (resolve, reject) => {
    // Make sure we have the required ENV parameters
    const requiredEnv = ["GITHUB_EVENT_NAME", "GITHUB_EVENT_PATH"];

    for (let name of requiredEnv) {
      if (!process.env[name]) {
        return reject(`Missing required environment variable: ${name}`);
      }
    }

    const promises = [];
    for (let guard of guards) {
      promises.push(runSingle(guard));
    }

    const results = await Promise.allSettled(promises);

    const rejected = results.filter((r) => r.status === "rejected");

    if (rejected.length === results.length) {
      const errors = rejected.map((r) => r.reason).join("\n");

      // If we're checking multiple guards, add a prefix
      if (guards.length > 1) {
        prefix = "Expected at least one to pass, but all guards failed:\n\n";
      }
      return reject(`${prefix}${errors}`);
    }

    return resolve();
  });
};

function runSingle(params) {
  if (!params.event) {
    params = { event: params };
  }
  let expectedEventName = params.event;
  return new Promise((resolve, reject) => {
    // Save the event name and payload
    const event = process.env.GITHUB_EVENT_NAME;
    const payload = require(process.env.GITHUB_EVENT_PATH);

    // Check that the provided event matches what we're expecting
    let [expectedEvent, expectedAction] = expectedEventName.split(".", 2);
    if (event !== expectedEvent) {
      return reject(
        `Invalid event. Expected '${expectedEvent}', got '${event}'`
      );
    }

    if (expectedAction && payload.action !== expectedAction) {
      return reject(
        `Invalid event. Expected '${expectedEvent}.${expectedAction}', got '${event}.${payload.action}'`
      );
    }

    return resolve();
  });
}
