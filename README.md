# Action Guard

Make sure that your GitHub Actions are only running on events that you're expecting.

Replaces:

```javascript
const event = process.env.GITHUB_EVENT_NAME;
const payload = require(process.env.GITHUB_EVENT_PATH);

if (event != "pull_request" || payload.action != "closed") {
  console.log(`
    This action only runs on pull_request.closed
    Found: ${event}.${payload.action}
  `);
  return;
}
```

With:

```javascript
require("action-guard")("pull_request.closed");
```

If you're looking for a way to handle multiple events + actions, you might find [@mheap/action-router](https://github.com/mheap/action-router) useful

## Installation

```bash
npm install action-guard
```

## Usage

Action Guard will throw an error if the `GITHUB_EVENT_NAME` does not match what is expected

If you're happy to leave it uncaught (leading to a `process.exit(1)`) you can add it as one line:

```javascript
require("action-guard")("pull_request.closed");
```

Alternatively, you can wrap it in a try/catch

```javascript
const guard = require("action-guard");

try {
  guard("pull_request.closed");
} catch (e) {
  // It didn't match. Let's do something else
}
```
