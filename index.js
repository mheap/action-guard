module.exports = (expectedEventName) => {
  return new Promise((resolve, reject) => {
    // Make sure we have the required ENV parameters
    const requiredEnv = ["GITHUB_EVENT_NAME", "GITHUB_EVENT_PATH"];

    for (let name of requiredEnv) {
      if (!process.env[name]) {
        return reject(`Missing required environment variable: ${name}`);
      }
    }

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

    if (payload.action !== expectedAction) {
      return reject(
        `Invalid event. Expected '${expectedEvent}.${expectedAction}', got '${event}.${payload.action}'`
      );
    }

    return resolve();
  });
};
