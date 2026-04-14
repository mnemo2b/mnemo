# Debugging Node

The toolbox, in order I reach for them.

## console.log (still underrated)

Cheap, always works, easy to remove. Tag logs so they're greppable:

```javascript
console.log('[auth:validate]', { user, result });
```

Remove with a lint rule before commit.

## node --inspect

```
node --inspect-brk app.js
```

Connect from Chrome DevTools (`chrome://inspect`) or VS Code. Breakpoints, watch, step through. `--inspect-brk` pauses at start so you can set breakpoints before execution.

## VS Code launch config

`.vscode/launch.json` with `"type": "node"`. Hit F5, done. Use `"runtimeArgs": ["--import", "tsx"]` for TypeScript without build step.

## Heap snapshots

Memory leaks:

```javascript
const { writeHeapSnapshot } = require('v8');
writeHeapSnapshot();
```

Load `.heapsnapshot` in Chrome DevTools Memory tab. Find retained objects, look for detached DOM / unclosed listeners.

## Async stack traces

Node prints async stack traces by default since 14. If yours are cut off, check that you're not swallowing Promises.

## Production debugging

- Don't ship `--inspect` to prod (remote code execution)
- Use structured logs (pino, winston)
- Attach a debugger to a running prod-like container in staging
