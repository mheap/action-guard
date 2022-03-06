const guard = require(".");
const mockedEnv = require("mocked-env");

// Delete the GITHUB_EVENT_NAME and GITHUB_EVENT_PATH keys
// as they'll be present by default on the GitHub Actions runners
delete process.env.GITHUB_EVENT_NAME;
delete process.env.GITHUB_EVENT_PATH;

describe("Action Guard", () => {
  let restore = () => {};

  afterEach(() => {
    restore();
    jest.resetModules();
  });

  describe("Check ENV variables", () => {
    it("throws if GITHUB_EVENT_NAME is not set", () => {
      expect(() => {
        guard("push");
      }).toThrow(
        new Error("Missing required environment variable: GITHUB_EVENT_NAME")
      );
    });

    it("throws if GITHUB_EVENT_PATH is not set", () => {
      restore = mockedEnv({
        GITHUB_EVENT_NAME: "push",
      });
      expect(() => {
        guard("push");
      }).toThrow(
        new Error("Missing required environment variable: GITHUB_EVENT_PATH")
      );
    });

    it("throws if no event is provided", () => {
      restore = mockedEnv({
        GITHUB_EVENT_NAME: "push",
        GITHUB_EVENT_PATH: "/path/to/event.json",
      });
      expect(() => {
        guard("");
      }).toThrow(new Error("Usage: guard('<event>')"));
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

  describe("Calling formats", () => {
    it("string", () => {
      mockEvent("pull_request", { action: "opened" });
      return expect(() => {
        guard("push");
      }).toThrow("Invalid event. Expected 'push', got 'pull_request'");
    });

    it("object", () => {
      mockEvent("pull_request", { action: "opened" });
      return expect(() => {
        guard({ event: "push" });
      }).toThrow("Invalid event. Expected 'push', got 'pull_request'");
    });

    it("array of strings", () => {
      mockEvent("pull_request", { action: "opened" });
      return expect(() => {
        guard(["push"]);
      }).toThrow("Invalid event. Expected 'push', got 'pull_request'");
    });

    it("array of objects", () => {
      mockEvent("pull_request", { action: "opened" });
      return expect(() => {
        guard([{ event: "push" }]);
      }).toThrow("Invalid event. Expected 'push', got 'pull_request'");
    });
  });

  describe("Multiple Guards", () => {
    it("throws if all guards fail (string)", () => {
      mockEvent("issue", { action: "opened" });
      return expect(() => {
        guard(["push", "pull_request"]);
      }).toThrow(
        "Expected at least one to pass, but all guards failed:\n\nInvalid event. Expected 'push', got 'issue'\nInvalid event. Expected 'pull_request', got 'issue'"
      );
    });

    it("throws if all guards fail (object)", () => {
      mockEvent("issue", { action: "opened" });
      return expect(() => {
        guard([{ event: "push" }, { event: "pull_request" }]);
      }).toThrow(
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
