const guard = require(".");
const mockedEnv = require("mocked-env");

describe("Action Guard", () => {
  let restore = () => {};

  afterEach(() => {
    restore();
    jest.resetModules();
  });

  describe("Check ENV variables", () => {
    it("rejects if GITHUB_EVENT_NAME is not set", () => {
      return expect(guard).rejects.toBe(
        "Missing required environment variable: GITHUB_EVENT_NAME"
      );
    });

    it("rejects if GITHUB_EVENT_PATH is not set", () => {
      restore = mockedEnv({
        GITHUB_EVENT_NAME: "push",
      });
      return expect(guard).rejects.toBe(
        "Missing required environment variable: GITHUB_EVENT_PATH"
      );
    });
  });

  describe("Event Check", () => {
    it("rejects if the GITHUB_EVENT_NAME does not match (event only)", () => {
      mockEvent("pull_request", { action: "opened" });
      return expect(guard("push")).rejects.toBe(
        "Invalid event. Expected 'push', got 'pull_request'"
      );
    });

    it("rejects if the GITHUB_EVENT_NAME does not match (event + action)", () => {
      mockEvent("pull_request", { action: "opened" });
      return expect(guard("issue.opened")).rejects.toBe(
        "Invalid event. Expected 'issue', got 'pull_request'"
      );
    });

    it("rejects if the action does not match (event + action)", () => {
      mockEvent("pull_request", { action: "closed" });
      expect(guard("pull_request.opened")).rejects.toBe(
        "Invalid event. Expected 'pull_request.opened', got 'pull_request.closed'"
      );
    });
  });

  describe("Calling formats", () => {
    it("string", () => {
      mockEvent("pull_request", { action: "opened" });
      return expect(guard("push")).rejects.toBe(
        "Invalid event. Expected 'push', got 'pull_request'"
      );
    });

    it("object", () => {
      mockEvent("pull_request", { action: "opened" });
      return expect(guard({ event: "push" })).rejects.toBe(
        "Invalid event. Expected 'push', got 'pull_request'"
      );
    });

    it("array of strings", () => {
      mockEvent("pull_request", { action: "opened" });
      return expect(guard(["push"])).rejects.toBe(
        "Invalid event. Expected 'push', got 'pull_request'"
      );
    });

    it("array of objects", () => {
      mockEvent("pull_request", { action: "opened" });
      return expect(guard([{ event: "push" }])).rejects.toBe(
        "Invalid event. Expected 'push', got 'pull_request'"
      );
    });
  });

  describe("Multiple Guards", () => {
    it("rejects if all guards fail (string)", () => {
      mockEvent("issue", { action: "opened" });
      return expect(guard(["push", "pull_request"])).rejects.toBe(
        "Expected at least one to pass, but all guards failed:\n\nInvalid event. Expected 'push', got 'issue'\nInvalid event. Expected 'pull_request', got 'issue'"
      );
    });

    it("rejects if all guards fail (object)", () => {
      mockEvent("issue", { action: "opened" });
      return expect(
        guard([{ event: "push" }, { event: "pull_request" }])
      ).rejects.toBe(
        "Expected at least one to pass, but all guards failed:\n\nInvalid event. Expected 'push', got 'issue'\nInvalid event. Expected 'pull_request', got 'issue'"
      );
    });
  });
});

function mockEvent(eventName, mockPayload) {
  jest.mock(
    "/github/workspace/event.json",
    () => {
      return mockPayload;
    },
    {
      virtual: true,
    }
  );

  const params = {
    GITHUB_EVENT_NAME: eventName,
    GITHUB_EVENT_PATH: "/github/workspace/event.json",
  };

  return mockedEnv(params);
}
