# Async / Await

Syntactic sugar on top of Promises. Makes asynchronous code read like synchronous code.

## Basics

```javascript
async function fetchUser(id) {
  const res = await fetch(`/users/${id}`);
  return res.json();
}
```

`async` marks a function as always returning a Promise. `await` pauses until a Promise settles.

## Parallel vs sequential

```javascript
// sequential — slow
const a = await fetchA();
const b = await fetchB();

// parallel — fast
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

If two awaits don't depend on each other, always kick them off together.

## Error handling

```javascript
try {
  const user = await fetchUser(id);
} catch (err) {
  // network error, 4xx, 5xx, parse errors — all land here
}
```

Prefer try/catch at the boundary where you can recover. Deep-nested try/catch is a smell.

## Gotchas

- `forEach` doesn't await — use `for...of` or `Promise.all(array.map(...))`
- Returning a Promise from an async function: `return await` is usually unnecessary (just `return`)
- Unhandled rejections crash Node; bubble up or catch
