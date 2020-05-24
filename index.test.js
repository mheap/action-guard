const guard = require(".");
const mockedEnv = require("mocked-env");

describe("Action Guard", () => {
  let restore = () => {};

  afterEach(() => {
    restore();
    jest.resetModules();
  });

  describe("Check ENV variables", () => {
    it("throws if GITHUB_EVENT_NAME is not set", () => {
      expect(guard).toThrow(
        new Error("Missing required environment variable: GITHUB_EVENT_NAME")
      );
    });

    it("throws if GITHUB_EVENT_PATH is not set", () => {
      restore = mockedEnv({
        GITHUB_EVENT_NAME: "push",
      });
      expect(guard).toThrow(
        new Error("Missing required environment variable: GITHUB_EVENT_PATH")
      );
    });
  });

  describe("Event Check", () => {
    it("throws if the GITHUB_EVENT_NAME does not match (event only)", () => {
      mockEvent("pull_request", { action: "opened" });
      expect(() => {
        guard("push");
      }).toThrow(
        new Error("Invalid event. Expected 'push', got 'pull_request'")
      );
    });

    it("throws if the GITHUB_EVENT_NAME does not match (event + action)", () => {
      mockEvent("pull_request", { action: "opened" });
      expect(() => {
        guard("issue.opened");
      }).toThrow(
        new Error("Invalid event. Expected 'issue', got 'pull_request'")
      );
    });

    it("throws if the action does not match (event + action)", () => {
      mockEvent("pull_request", { action: "closed" });
      expect(() => {
        guard("pull_request.opened");
      }).toThrow(
        new Error(
          "Invalid event. Expected 'pull_request.opened', got 'pull_request.closed'"
        )
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
