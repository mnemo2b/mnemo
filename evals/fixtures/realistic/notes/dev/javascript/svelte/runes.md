# Svelte Runes

Runes (Svelte 5) replace the old reactive `$:` syntax. They're compiler primitives that make reactivity explicit and portable outside `.svelte` files.

## `$state`

```svelte
<script>
  let count = $state(0);
</script>

<button on:click={() => count++}>{count}</button>
```

Mutating `count` triggers re-render. Works on primitives and objects (proxied).

## `$derived`

```javascript
let doubled = $derived(count * 2);
```

Reactive computed value. Recalculates when its dependencies change.

## `$effect`

```javascript
$effect(() => {
  console.log('count changed:', count);
});
```

Runs on mount and whenever tracked state changes. Return a cleanup function for teardown.

## `$props`

```javascript
let { name, age = 0 } = $props();
```

Destructure props with defaults. TypeScript-friendly.

## `$bindable`

```javascript
let { value = $bindable() } = $props();
```

Opt-in two-way binding for props.

## Why runes

- Explicit — you see reactivity in the code, not implicit via magic
- Portable — use in `.svelte.ts` files, not just components
- Fine-grained — updates target exactly what changed
