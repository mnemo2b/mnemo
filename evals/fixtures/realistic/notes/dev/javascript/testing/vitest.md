# Vitest

Jest-compatible test runner, Vite-powered. Fast cold start, native ESM, TypeScript out of the box.

## Setup

```
npm i -D vitest
```

```json
// package.json
{ "scripts": { "test": "vitest" } }
```

Watch mode by default. `vitest run` for one-shot. `vitest --ui` opens a browser UI.

## Basics

```typescript
import { describe, test, expect, beforeEach } from 'vitest';

describe('add', () => {
  test('two positives', () => {
    expect(add(1, 2)).toBe(3);
  });
});
```

## Mocking

```typescript
import { vi } from 'vitest';

const mockFetch = vi.fn().mockResolvedValue({ json: async () => ({ ok: true }) });
vi.stubGlobal('fetch', mockFetch);
```

Module mocks:

```typescript
vi.mock('./api', () => ({ fetchUser: vi.fn() }));
```

## Snapshots

```typescript
expect(component).toMatchSnapshot();
// or inline
expect(component).toMatchInlineSnapshot();
```

Inline snapshots keep the expected value next to the test — easier to review.

## Coverage

```
vitest run --coverage
```

Powered by v8 or istanbul. Tune in `vitest.config.ts`.

## Why over Jest

- Faster startup (shares Vite's transform pipeline)
- Native ESM, no Babel needed
- Same API for drop-in migration
