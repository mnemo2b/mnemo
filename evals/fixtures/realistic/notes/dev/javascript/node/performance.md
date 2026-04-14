# Node Performance

Measure before optimizing. Most Node apps are I/O-bound, not CPU-bound.

## Profiling

### CPU

```
node --prof app.js
# run workload
node --prof-process isolate-*.log > perf.txt
```

Or use clinic.js flame graphs:

```
npx clinic flame -- node app.js
```

### Memory

`--inspect` + Chrome DevTools → Memory tab. Take heap snapshots before/after suspected leaks, compare retained objects.

## Common wins

- **Don't JSON.parse/stringify hot paths** — it's CPU-expensive. Stream-parse JSON if possible.
- **Pool connections** — DB, HTTP agents with `keepAlive: true`
- **Stream large responses** — don't load whole files into memory
- **Avoid sync APIs in request paths** — `fs.readFileSync`, `crypto.randomBytes` sync variant
- **Cache smartly** — in-memory LRU for read-heavy data, Redis for shared
- **Use worker_threads for CPU work** — don't block the event loop

## Event loop lag

```javascript
import { monitorEventLoopDelay } from 'perf_hooks';
const h = monitorEventLoopDelay();
h.enable();
// ... later
console.log(h.mean / 1e6, 'ms mean lag');
```

> 50ms mean = investigate. Usually a CPU-bound operation blocking the loop.

## Don't

- Optimize before measuring
- Micro-bench in isolation when the bottleneck is DB or network
- Rewrite in Rust "for perf" as a first move
