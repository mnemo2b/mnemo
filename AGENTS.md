# mnemo

A personal context layer that sits above your AI tools. Instead of each tool starting cold, mnemo gives them access to your knowledge — conventions, research, preferences, domain expertise — so every AI interaction starts informed.

## Vision

The current paradigm embeds AI inside apps, but each one rebuilds understanding from scratch. Mnemo inverts this: one knowledge base, queryable from any AI surface. The user curates the notes, the agent retrieves what's relevant. Think "Cursor for your knowledge base."

## Where We Are

v0.3 (multi-base support) is complete. The MCP server and CLI can browse and load notes across multiple named bases. The Claude Code skill provides `/mnemo list`, `/mnemo load`, and `/mnemo save` commands. Next: v0.4 (sets + .mnemo project config).

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
- **MCP SDK** (@modelcontextprotocol/sdk) — tool integration

No Bun-specific APIs — code must be Node.js-compatible for distribution.

## Context

This project has a knowledge base accessible via mnemo. Use `mnemo list` to see what's available — the directory structure will guide you to specs, decisions, and documentation relevant to whatever you're working on.
