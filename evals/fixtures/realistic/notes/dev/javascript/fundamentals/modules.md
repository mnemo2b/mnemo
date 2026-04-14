# Modules

Two systems coexist: CommonJS (CJS, `require`) and ES Modules (ESM, `import`). ESM is the future but CJS still dominates legacy Node.

## ESM

```javascript
// named export
export const foo = 1;
export function bar() {}

// default export
export default function () {}

// import
import { foo, bar } from './mod.js';
import thing from './mod.js';
```

- static — imports resolve at parse time
- tree-shakeable (bundlers can eliminate unused exports)
- top-level await works

## CJS

```javascript
// export
module.exports = { foo, bar };
exports.foo = 1;

// import
const { foo } = require('./mod');
```

- dynamic — `require` can be called conditionally
- synchronous
- no tree-shaking

## Interop

- Node supports both. ESM files are `.mjs` or `"type": "module"` in package.json.
- ESM can import CJS (as a default export)
- CJS can't import ESM except via dynamic `import()` (returns a Promise)
- `__dirname` / `__filename` don't exist in ESM — use `import.meta.url` + `fileURLToPath`

## When to pick which

New code: ESM. Legacy: whatever the codebase uses. Libraries: publish both via `"exports"` in package.json.
