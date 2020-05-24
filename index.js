module.exports = (expectedEventName) => {
  // Make sure we have the required ENV parameters
  const requiredEnv = ["GITHUB_EVENT_NAME", "GITHUB_EVENT_PATH"];

  for (let name of requiredEnv) {
    if (!process.env[name]) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  // Save the event name and payload
  const event = process.env.GITHUB_EVENT_NAME;
  const payload = require(process.env.GITHUB_EVENT_PATH);

  // Check that the provided event matches what we're expecting
  let [expectedEvent, expectedAction] = expectedEventName.split(".", 2);
  if (event !== expectedEvent) {
    throw new Error(
      `Invalid event. Expected '${expectedEvent}', got '${event}'`
    );
  }

  if (payload.action !== expectedAction) {
    throw new Error(
      `Invalid event. Expected '${expectedEvent}.${expectedAction}', got '${event}.${payload.action}'`
    );
  }
};
