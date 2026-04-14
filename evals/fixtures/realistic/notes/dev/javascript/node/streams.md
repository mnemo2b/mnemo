# Node Streams

Read/write data chunk by chunk instead of loading it all into memory. Essential for files > a few MB, network I/O, and any pipeline.

## Four types

- **Readable** — source (fs.createReadStream, http request)
- **Writable** — sink (fs.createWriteStream, http response)
- **Duplex** — both (sockets)
- **Transform** — duplex that modifies data as it flows (gzip, crypto)

## The pipe

```javascript
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

await pipeline(
  createReadStream('input.txt'),
  createGzip(),
  createWriteStream('input.txt.gz')
);
```

`pipeline` handles backpressure and cleanup on error. Prefer it over `.pipe()`.

## Object mode

Most streams deal with Buffers. Object mode lets you stream JS objects instead:

```javascript
new Readable({ objectMode: true, ... });
```

Useful for parser pipelines: raw bytes → tokens → parsed records.

## Web Streams

Modern alternative, standardized across Node, browsers, and edge runtimes. `ReadableStream`, `WritableStream`, `TransformStream`. Prefer for new code if target supports it.

## Gotchas

- Error handling: one error anywhere in a pipeline should tear down the whole thing — `pipeline` does this right
- Backpressure: slow writers signal readers to pause; your transforms must propagate it
- Memory: forgetting to consume a stream leaks buffers
