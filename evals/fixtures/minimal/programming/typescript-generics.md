# TypeScript Generics

Generics let functions and types work across multiple types without losing type information. The alternative is `any`, which works but throws away the compiler's ability to catch mistakes.

## Basic pattern

A generic function declares a type parameter that gets filled in at the call site:

```typescript
function first<T>(items: T[]): T {
  return items[0]
}
```

The caller doesn't specify `T` explicitly — TypeScript infers it from the argument.

## Constraints

`extends` limits what types a generic accepts:

```typescript
function getLength<T extends { length: number }>(item: T): number {
  return item.length
}
```

This accepts strings, arrays, or anything with a `length` property — but not numbers or booleans.

## When generics help

- container types (arrays, maps, results) that shouldn't care about their contents
- functions that transform data while preserving its type
- avoiding duplicate interfaces that differ only in one type
