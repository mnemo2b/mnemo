# State Management

What to reach for, in order of complexity.

## Local state

`useState` or `useReducer`. If state doesn't need to cross components, stop here.

## Lifting state up

Move state to a common ancestor. Fine for small trees — gets unwieldy past 3-4 levels.

## Context

Good for: theme, current user, i18n, values that don't change often.
Bad for: high-frequency updates (every consumer re-renders).

## Zustand

My default for cross-cutting state. Lightweight, no boilerplate, TypeScript-friendly.

```javascript
const useStore = create((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));
```

## Redux Toolkit

Overkill for most apps. Worth it when: large team, time-travel debugging, heavy async flows that benefit from middleware.

## Server state

Separate category. Tanstack Query (or SWR) handles caching, revalidation, optimistic updates. Don't shoehorn into Redux.

## Decision tree

- Single component → `useState`
- 2-3 siblings → lift up
- App-wide, low-frequency → Context
- App-wide, high-frequency → Zustand
- Data from an API → Tanstack Query
