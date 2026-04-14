# Data Fetching in React

The evolution from useEffect → hooks libraries → server components.

## useEffect (don't)

```jsx
useEffect(() => {
  fetch('/api/user').then(r => r.json()).then(setUser);
}, []);
```

Problems: no caching, no deduping, race conditions on re-renders, no retry, no error state unless you build it.

## Tanstack Query

Solves all of the above.

```jsx
const { data, isLoading, error } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetch(`/api/user/${id}`).then(r => r.json()),
});
```

- Automatic caching (by queryKey)
- Stale-while-revalidate
- Deduping (same key, one fetch)
- Refetch on window focus
- Mutations with optimistic updates

## SWR

Same space, lighter. Good if you just need stale-while-revalidate.

## Server Components (RSC)

Skip the client fetch entirely:

```jsx
async function UserPage({ id }) {
  const user = await db.users.findById(id);
  return <h1>{user.name}</h1>;
}
```

No loading states, no waterfalls, smaller bundles. Requires a framework (Next, Remix).

## Patterns

- Put the query close to where it's used; share via queryKey, not prop drilling
- Prefetch on hover/focus for perceived speed
- Always handle `error` and `isLoading` in the UI
