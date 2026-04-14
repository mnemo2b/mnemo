# Recipe App — Architecture

## Shape

```
recipe-app/
├── web/          # SvelteKit frontend
├── core/         # Rust, compiled to WASM + native
├── server/       # Optional sync backend (Rust)
└── db/           # SQLite schema + migrations
```

Core logic in Rust. Web UI in Svelte. Same core runs locally (WASM in browser) or server (native binary).

## Data

One source of truth: SQLite. Schema:
- `recipes` — id, name, source, created_at, updated_at
- `ingredients` — recipe_id, quantity, unit, item, group (e.g. "for the sauce")
- `steps` — recipe_id, order, text, timer_minutes
- `notes` — recipe_id, created_at, text
- `tags` — recipe_id, tag
- `versions` — snapshots via JSON diff on significant changes

Shopping list and meal plans are derived views, not stored state.

## Sync (future)

- SQLite as canonical store
- Last-write-wins with timestamps for v1
- CRDT for fields that benefit (notes, tags)
- Server holds encrypted blob + metadata; clients decrypt locally

## Why SQLite

- Local-first: no network dependency
- Portable: one file, one backup
- Performant: indexes for full-text search, 100k+ recipes easily
- Rust ecosystem support is excellent (rusqlite, sqlx)

## LLM integration

- URL import: fetch, pass HTML to Claude, get structured recipe back
- Photo OCR: Claude vision → structured recipe
- Smart suggestions: "what to cook with these ingredients"

Prompts and schemas in `core/src/llm/`. No SDK lock-in — raw HTTP with a provider abstraction.

## What I'm NOT building

- Social features (share, follow, comment)
- Cloud-only storage
- Ads or a business model
- Cross-platform sync before the single-device experience is solid
