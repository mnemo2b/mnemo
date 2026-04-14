# ESM vs CJS in Node

The interop story is messy but workable once you understand the rules.

## Identifying which you're in

- `.mjs` → ESM
- `.cjs` → CJS
- `.js` → depends on closest `"type"` in package.json (`"module"` = ESM, default = CJS)

## What breaks when you move CJS to ESM

- `require` → `import` (static) or `import()` (dynamic)
- `__dirname` / `__filename` gone — use:
  ```javascript
  import { fileURLToPath } from 'url';
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  ```
- `module.exports` → `export`
- JSON imports need `with { type: 'json' }` or a loader
- No synchronous require — only async import()

## Interop direction

- **ESM → CJS**: ✅ works. `import pkg from 'cjs-lib'` — default import gets `module.exports`.
- **CJS → ESM**: 🚫 static `require` doesn't work. Use dynamic `import()`:
  ```javascript
  const { foo } = await import('esm-lib');
  ```

## Dual packages

Libraries ship both via `"exports"` field:

```json
{
  "exports": {
    ".": {
      "import": "./esm/index.js",
      "require": "./cjs/index.js",
      "types": "./types/index.d.ts"
    }
  }
}
```

## Practical advice

New projects: ESM. Maintenance projects: stay where you are unless there's a reason to migrate.
