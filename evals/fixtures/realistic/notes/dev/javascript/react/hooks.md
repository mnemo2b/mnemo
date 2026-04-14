# React Hooks

Functions that let function components use state and lifecycle. The foundation of modern React.

## Core hooks

- `useState` — local state
- `useEffect` — side effects (fetch, subscriptions, DOM)
- `useRef` — mutable ref that doesn't trigger re-render
- `useMemo` — memoize expensive computation
- `useCallback` — memoize function identity for child stability
- `useContext` — read context value
- `useReducer` — state with actions, better for complex transitions

## Rules

- Only call at top level (no conditionals, loops)
- Only call from components or other hooks
- ESLint plugin enforces both

## useEffect pitfalls

- Missing dependencies → stale closures
- Object/array deps → infinite loops (compared by reference)
- Fetch in useEffect → race conditions (use AbortController)
- Setting state unconditionally → infinite loops

## When NOT to use

- **useState** for derived values — just compute during render
- **useEffect** for synchronizing with events — use event handlers
- **useMemo / useCallback** prematurely — they're not free; profile first

## Custom hooks

Named `useX`, compose other hooks. Pattern for sharing stateful logic without HOCs or render props.
