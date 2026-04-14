# React Server Components

Components that run on the server, send their rendered output (not JS) to the client. Part of React 19 / Next 13+.

## The mental model

- **Server Components** — render once on server, no JS ships, no interactivity
- **Client Components** — the React we know, shipped to browser, interactive
- Boundary: `"use client"` directive at the top of a file

## What changes

- Fetch data directly in components (no useEffect dance)
- `async` components are fine
- Import server-only deps (db, fs, secrets) freely
- Lighter bundles — non-interactive UI doesn't ship JS

## What doesn't work in server components

- `useState`, `useEffect`, event handlers
- Browser-only APIs (`window`, `document`)
- Context (can't cross the boundary)

## Data flow

Server components can import client components and pass them props — serializable only (no functions, Dates are fine, class instances aren't).

## Gotchas

- The boundary is a file boundary, not a component boundary
- Client components imported into server components run on the server first for HTML (SSR), then hydrate
- Server actions (`"use server"`) let client components call server functions — new RPC model
