# mnemo

A personal context layer that sits above your AI tools. Instead of each tool starting cold, mnemo gives them access to your knowledge — conventions, research, preferences, domain expertise — so every AI interaction starts informed.

## Vision

The current paradigm embeds AI inside apps, but each one rebuilds understanding from scratch. Mnemo inverts this: one knowledge base, queryable from any AI surface. The user curates the notes, the agent retrieves what's relevant. Think "Cursor for your knowledge base."

## Where We Are

v0.6.0 is published on npm as `@mnemo2b/mnemo`. Named sets bundle paths for reuse, `.mnemo` project files handle auto-loading, and the skill uses hub-and-spoke references. The MCP layer has been removed in favor of skills — the CLI is the only programmatic interface. Releases are automated via GitHub Actions with OIDC trusted publishing.

## Verification

After making code changes, run `bun test` to verify nothing is broken. Tests cover all core logic (pure functions in `src/core/`) and CLI behavior (subprocess integration tests). If you add new functionality, add corresponding tests in `tests/`.

After committing files in `skill/`, run `bun src/cli.ts setup` to reinstall the skill locally.

## Principles

- **Directory-as-location** — file path is the organizational model, no metadata needed
- **Search over composition** — return full notes, no graph traversal or token budgeting
- **Focused documents** — one topic per note at natural length, not atomic fragments
- **Context window is a feature** — every note displaces space for the actual task, so return only what's relevant
- **Wider, not deeper** — prefer more top-level categories over deep nesting
- **Never return nothing** — suggest alternatives when a search has no results

## Tech Stack

- **Bun** — package manager + dev runner (runs TypeScript directly)
- **tsdown** — build tool (esbuild-based bundler)
- **Node.js** — distribution runtime (`npm install -g`)
- **TypeScript** — single package, no monorepo

No Bun-specific APIs — code must be Node.js-compatible for distribution.

## Local Dev

The global `mnemo` binary and `bun src/cli.ts` are different builds. Changes to `src/` only take effect in the global binary after rebuild:

`bun run build && npm install -g .`

Rebuild before: running evals, testing CLI in terminal, or running `bun src/cli.ts setup`.
Not needed for: development with `bun src/cli.ts` directly.

## Context

This project uses mnemo.
