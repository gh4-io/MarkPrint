# Core Node.js Event-Driven APIs

- **EventEmitter** underpins the event architecture; most Node.js abstractions (streams, servers, timers) inherit from it, so understanding listener registration, `'error'` handling, and emission semantics explains how userland and core modules coordinate synchronous callbacks.
- **Streams** build on EventEmitter semantics but add flow-control contracts—`pipe()`/`pipeline()` chain readable, transform, and writable endpoints while applying backpressure so emitters do not flood consumers; custom streams can expose higher-level events or operate in object mode.
- **Async Hooks** observe the lifecycle of the async resources that EventEmitters and Streams rely on, letting tooling correlate callbacks, promises, and handles. Although experimental, they reveal relationships between execution contexts (via `executionAsyncId()` and `triggerAsyncId()`) that aid debugging or telemetry.
- Together, these APIs describe the stack from low-level async resource creation (async hooks) to streaming data flow (streams) to the simple event listeners applications consume (EventEmitter). Mastering them clarifies how Node.js schedules work, propagates errors, and manages resource cleanup, which is critical for building debuggable, well-behaved services.

See detailed notes in:
- `.plan/ref/docs/eventemitter.md`
- `.plan/ref/docs/streams.md`
- `.plan/ref/docs/async-hooks.md`
