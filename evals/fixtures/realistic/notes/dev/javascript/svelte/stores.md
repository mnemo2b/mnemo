# Svelte Stores

Cross-component state. Writable, readable, derived. In Svelte 5, often replaced by `$state` in `.svelte.ts` files, but stores still matter for async and cross-framework use.

## Writable

```javascript
import { writable } from 'svelte/store';
export const count = writable(0);
```

```svelte
<script>
  import { count } from './stores';
</script>

<p>{$count}</p>
<button on:click={() => $count++}>+</button>
```

The `$` prefix auto-subscribes and unsubscribes.

## Readable

```javascript
export const time = readable(new Date(), (set) => {
  const id = setInterval(() => set(new Date()), 1000);
  return () => clearInterval(id);
});
```

External source of truth, tear-down on last unsubscribe.

## Derived

```javascript
export const doubled = derived(count, ($count) => $count * 2);
```

Reactive to one or more stores.

## Runes vs stores

```javascript
// runes (Svelte 5, .svelte.ts)
export const count = $state({ value: 0 });

// stores (classic, works everywhere)
export const count = writable(0);
```

Use runes inside Svelte apps. Use stores when sharing with non-Svelte code or for async sources.
