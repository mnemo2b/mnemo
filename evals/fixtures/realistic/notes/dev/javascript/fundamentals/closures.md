# Closures

A closure is a function that captures variables from its enclosing scope. The captured variables stay alive as long as the closure does — even after the outer function returns.

## Basic example

```javascript
function makeCounter() {
  let count = 0;
  return () => ++count;
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
```

`count` lives in `makeCounter`'s scope but the returned arrow function keeps a reference to it, so it persists.

## Common uses

- **Private state** — hide variables behind a function interface
- **Memoization** — cache results across calls
- **Partial application / currying** — bake in some arguments, return a function expecting the rest
- **Module pattern** (pre-ES6) — expose a public API while hiding internals

## Gotcha: `var` in loops

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 3, 3, 3
}
```

`var` is function-scoped, so all closures share the same `i`. Use `let` (block-scoped) and each iteration creates a new binding.
