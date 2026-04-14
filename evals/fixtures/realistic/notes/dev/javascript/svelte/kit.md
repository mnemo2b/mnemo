# SvelteKit

Meta-framework for Svelte. File-based routing, SSR, API routes, deployment adapters.

## Routing

```
src/routes/
├── +page.svelte          # /
├── about/+page.svelte    # /about
├── blog/
│   ├── +page.svelte      # /blog (list)
│   └── [slug]/+page.svelte  # /blog/:slug
```

- `+page.svelte` — page component
- `+layout.svelte` — wraps pages in its directory and children
- `+page.server.ts` — server-only logic (load, actions)
- `+page.ts` — universal load (runs on server then client)

## Load functions

```typescript
export async function load({ params, fetch }) {
  const post = await fetch(`/api/posts/${params.slug}`).then(r => r.json());
  return { post };
}
```

Data shows up as `data` prop in the page. `params` are route parameters.

## Form actions

```typescript
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    // ...
  }
};
```

Progressive enhancement: forms work without JS.

## Adapters

- `@sveltejs/adapter-auto` — detects Vercel, Netlify, Cloudflare
- `@sveltejs/adapter-node` — self-hosted Node server
- `@sveltejs/adapter-static` — prerendered static site

Pick the right adapter for deploy target.
