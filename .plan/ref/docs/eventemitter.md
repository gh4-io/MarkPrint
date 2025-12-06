# Node.js EventEmitter

## Purpose
- Implements Node.js core event-driven pattern where emitters publish named events that synchronously invoke registered listeners; underpins APIs like `net.Server`, streams, etc.
- Central APIs live in `node:events` and expose base class `EventEmitter` that all event-producing objects inherit so user code can extend or compose them.

## Common patterns
1. Register listeners with `on()`/`addListener()` for repeated notifications or `once()` for single-use handlers; `prependListener()`/`prependOnceListener()` allow prioritizing handlers.
2. Emit events with `emit(eventName, ...args)`; listeners receive arguments and share the emitter instance as `this` by default.
3. Manage listener lifecycles using `off()`/`removeListener()` and `removeAllListeners()` along with `setMaxListeners()` to surface potential leaks; always add an `'error'` handler to avoid process crashes for stream- and socket-like emitters.
4. Bridge between emitters by re-emitting events, using `eventEmitter.eventNames()`/`listenerCount()` introspection for diagnostics and debugging.

## Code sample
```js
import { EventEmitter } from 'node:events';

class Heartbeat extends EventEmitter {
  start(intervalMs = 1000) {
    if (this.timer) return;
    this.timer = setInterval(() => this.emit('tick', Date.now()), intervalMs);
  }
  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.emit('stopped');
  }
}

const hb = new Heartbeat();
hb.on('tick', (timestamp) => console.log('pulse', timestamp));
hb.once('stopped', () => console.log('heartbeat halted'));

hb.start();
setTimeout(() => hb.stop(), 3100);
```

## Official docs
- https://nodejs.org/api/events.html
