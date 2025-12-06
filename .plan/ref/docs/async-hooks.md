# Node.js Async Hooks

## Purpose
- `node:async_hooks` exposes instrumentation hooks that fire for the lifecycle of low-level async resources (`init`, `before`, `after`, `destroy`, `promiseResolve`) so tooling can correlate callbacks, promises, and handles.
- API is experimental (Stability: 1) and discouraged for general context propagation; prefer stable `AsyncLocalStorage` when possible, reserving async hooks for observability or diagnostics cases that require per-resource details.

## Common patterns
1. Create a hook via `async_hooks.createHook(callbacks)` and call `.enable()` to start receiving lifecycle events; callbacks receive `asyncId`, `type`, `triggerAsyncId`, and the resource handle.
2. Use `executionAsyncId()`/`triggerAsyncId()` to relate current call stacks to the async resource tree, enabling tracing graphs or causality mapping between handles like `Timeout`, `TCPWRAP`, and `PROMISE`.
3. Avoid async work/logging in callbacks; prefer synchronous logging (`fs.writeSync`) or guard recursion to prevent hooks from triggering themselves.
4. Pair hooks with `AsyncResource` subclasses when embedding custom async operations so instrumentation consumers see consistent `type` names and resource lifecycles.

## Code sample
```js
import async_hooks from 'node:async_hooks';
import { writeFileSync } from 'node:fs';

const hook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    writeFileSync('trace.log', `${type}(${asyncId}) <- ${triggerAsyncId}\n`, { flag: 'a' });
  },
  before(asyncId) {
    writeFileSync('trace.log', `> ${asyncId}\n`, { flag: 'a' });
  },
  after(asyncId) {
    writeFileSync('trace.log', `< ${asyncId}\n`, { flag: 'a' });
  },
  destroy(asyncId) {
    writeFileSync('trace.log', `x ${asyncId}\n`, { flag: 'a' });
  },
}).enable();

setTimeout(() => {
  Promise.resolve('done').then(() => {});
}, 10);

// To stop collecting events, later call hook.disable();
```

## Official docs
- https://nodejs.org/api/async_hooks.html
- https://github.com/nodejs/node/blob/main/doc/api/async_hooks.md
