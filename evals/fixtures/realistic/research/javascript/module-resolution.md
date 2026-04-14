# Research: JS Module Resolution

## Question

How does module resolution actually work across Node, bundlers, TypeScript, and browsers? Where do bugs come from?

## Node resolution

Node's algorithm for `import 'foo'`:
1. If starts with `.`, `..`, `/`, resolve as file/directory
2. Else, look in `node_modules` walking up the tree
3. For packages, consult `package.json` `"exports"` or `"main"`/`"module"`

## `"exports"` field

Most nuanced part of modern Node + bundlers.

```json
{
  "name": "foo",
  "exports": {
    ".": {
      "import": "./esm/index.mjs",
      "require": "./cjs/index.js",
      "types": "./types/index.d.ts"
    },
    "./utils": {
      "import": "./esm/utils.mjs",
      "require": "./cjs/utils.js"
    }
  }
}
```

- `"."` — the package entry
- Subpaths must be explicitly listed
- Consumers can ONLY import explicitly exported paths
- Common cause of "cannot find module foo/internal/thing" errors

## Conditions

- `import` — ESM consumer
- `require` — CJS consumer
- `node` — Node.js (vs browser)
- `browser` — browser environment
- `default` — fallback
- Custom conditions allowed (workers, react-server, etc.)

## TypeScript resolution

TypeScript uses its own resolver, configurable via `tsconfig.json`:
- `"moduleResolution": "bundler"` — new, defers to bundler's runtime rules (recommended for new projects)
- `"moduleResolution": "node16"` / `"nodenext"` — strict Node semantics
- `"moduleResolution": "node"` — legacy, predates exports field

Declaration files (`.d.ts`) for TS types often exported via `"types"` condition in exports map.

## Bundler differences

- **Vite** — respects exports map, supports "browser" condition
- **Webpack 5** — supports exports map since 5.0
- **esbuild** — supports exports but has some edge cases
- **Bun** — mostly compatible with Node
- **Rollup** — via @rollup/plugin-node-resolve, configurable conditions

## Common bugs

- Deep imports that worked pre-exports-map now fail
- Types resolve to one file, runtime to another
- Dual packages (ESM + CJS) cause "dual package hazard" (two instances of the same module)
- Tree shaking fails when exports map doesn't include `sideEffects: false`

## Debugging

- `node --trace-warnings` with `ERR_PACKAGE_PATH_NOT_EXPORTED`
- `npm explore package-name` to inspect resolution
- Webpack: `--profile --json` + analyzer to see what's bundled

## Sources

- Node docs on modules
- TypeScript module resolution docs
- Nicholas Lizzul's blog posts on `exports` field
- Isaac Z. Schlueter's writing
