# mnemo

A personal context layer that sits above your AI tools. Instead of each tool starting cold, mnemo gives them access to your knowledge — conventions, research, preferences, domain expertise — so every AI interaction starts informed.

## Vision

The current paradigm embeds AI inside apps, but each one rebuilds understanding from scratch. Mnemo inverts this: one knowledge base, queryable from any AI surface. The user curates the notes, the agent retrieves what's relevant. Think "Cursor for your knowledge base."

## Where We Are

Slice 1 (browse + read) is complete. The MCP server can list directories, show the full tree, and read notes. Next: frontmatter parsing, then SQLite + FTS5 search, then a Claude Code skill, then a CLI for installation and maintenance.

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

This project has a knowledge base accessible via mnemo. Use `mnemo_list("mnemo")` to see what's available — the directory structure will guide you to specs, decisions, and documentation relevant to whatever you're working on.
