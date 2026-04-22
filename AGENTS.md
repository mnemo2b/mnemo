# mnemo

> `CLAUDE.md` is a symlink to this file. Edit `AGENTS.md` directly.

A personal context layer that sits above your AI tools. Instead of each tool starting cold, mnemo gives them access to your knowledge — conventions, research, preferences, domain expertise — so every AI interaction starts informed.

## Vision

The current paradigm embeds AI inside apps, but each one rebuilds understanding from scratch. Mnemo inverts this: one knowledge base, queryable from any AI surface. The user curates the notes, the agent retrieves what's relevant. Think "Cursor for your knowledge base."

## Where We Are

v0.8.0 is published on npm as `@mnemo2b/mnemo`. The save skill ships with a dispatcher/sub-agent split, a three-signal destination vocabulary (`Specified`/`Suggested`/`Candidates`), and a `SAVED_WITH_PROPOSAL` status that separates authorized saves from inferred cross-file work via an always-on impact scan. A SessionStart prime hook injects bases, sets, and a depth-2 structure tree as agent context. `mnemo doctor` diagnoses install state (skill, agents, hook); `mnemo base add` auto-wires Claude Code on first run, staging named sub-agents under `~/.claude/agents/mnemo-*.md`. Named sets bundle paths for reuse, `.mnemo` project files handle auto-loading. The MCP layer has been removed in favor of skills — the CLI is the only programmatic interface. Releases are automated via GitHub Actions with OIDC trusted publishing.

## Verification

After making code changes, run `bun test` to verify nothing is broken. Tests cover all core logic (pure functions in `src/core/`) and CLI behavior (subprocess integration tests). If you add new functionality, add corresponding tests in `tests/`.

After committing files in `skill/` or `agents/`, run `bun src/cli.ts install` to reinstall locally.

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

Rebuild before: running evals, testing CLI in terminal, or running `bun src/cli.ts install`.
Not needed for: development with `bun src/cli.ts` directly.

## Style

- Sections: imports, types/constants, and functions are separate sections — use 80-char `// ---` separators between them, not between peer functions within a section
- JSDoc: lowercase, on all functions, blank line before function signature
- Ordering: sections first, export at the top of its section, supporting functions below alphabetically
- Breathing room: blank lines between logic blocks inside functions
- Comments: `//` lowercase, explain why not what
- Multiline strings: use array `.join("\n")` over inline `\n` for readability
- Error messages: use `\n  - ` list format over comma-separated when listing multiple items
- File naming: prefer general names (`validations.ts`) over narrow ones (`validate-name.ts`)

## Context

This project uses mnemo.
