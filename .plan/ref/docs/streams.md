# Node.js Streams

## Purpose
- Streams provide composable interfaces for reading/writing sequential data with bounded buffering and natural backpressure; core types are `Readable`, `Writable`, `Duplex`, and `Transform`.
- Enables efficient handling of files, sockets, compression, HTTP bodies, and custom data flows without loading entire payloads into memory.

## Common patterns
1. Flow control with `stream.pipe()` or `stream.pipeline()` to connect readable sources through optional transforms into writable destinations while automatic backpressure keeps buffers near `highWaterMark` thresholds.
2. Switching between flowing and paused modes via `'data'`/`'readable'` listeners, `read()`, `pause()`, and `resume()`; object mode streams opt in with `objectMode: true` to push arbitrary JavaScript values.
3. Creating custom transforms/duplexes by extending `stream.Transform`/`stream.Duplex` or by using utility helpers like `Readable.from()` for async generators and `stream.finished()` to know when a stream has ended.
4. Handling aborts and cancellation with `AbortController` signals passed to `pipeline()`/`finished()` to tear down complex pipelines reliably.

## Code sample
```js
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { Transform } from 'node:stream';

class LineCounter extends Transform {
  #count = 0;
  constructor() {
    super({ readableObjectMode: true });
  }
  _transform(chunk, encoding, cb) {
    this.#count += chunk.toString().split('\n').length - 1;
    cb(null, { chunk, total: this.#count });
  }
}

await pipeline(
  createReadStream('input.log'),
  new LineCounter(),
  async function* (source) {
    for await (const { chunk, total } of source) {
      yield `${total}: ${chunk}`;
    }
  },
  createWriteStream('numbered.log'),
);
```

## Official docs
- https://nodejs.org/api/stream.html
