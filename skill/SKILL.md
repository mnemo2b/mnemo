---
name: mnemo
description: Personal knowledge base powered by mnemo. Use when the user mentions "mnemo", "second brain", "knowledge base", or asks to browse/load/save notes. Also use proactively when project config (AGENTS.md) references a mnemo knowledge base.
---

# mnemo — Knowledge Base Skill

Uses the `mnemo` CLI (globally installed) for path resolution and the Read tool for file content. Never use `npx`.

## Prime context

You may already have mnemo context from the SessionStart hook (`mnemo prime`). If you see a `[mnemo]` system reminder with bases, sets, and a structure tree — use it. Route requests directly using that context. Paths always start with a base name (`eval/cooking`, not `cooking`). If a path fails, run `mnemo list --depth 2` to reorient.

## Reference files

- `references/list.md` — browsing the knowledge base tree
- `references/load.md` — loading notes into context
- `references/save.md` — saving notes to the knowledge base

Read the relevant reference file when you need detailed instructions.

## Proactive use

When project config (AGENTS.md) mentions a mnemo knowledge base:

- **Do:** run `mnemo list` to see what's available for orientation
- **Do:** mention relevant notes you spotted if they seem useful
- **Don't:** auto-load note content without the user asking
- **Don't:** use mnemo if the project has no mention of a knowledge base
