---
name: mnemo
description: Personal knowledge base powered by mnemo. Use when the user mentions "mnemo", "second brain", "knowledge base", or invokes /mnemo commands (list, load) to browse and read notes. Also use proactively when project config (CLAUDE.md, AGENTS.md) references a mnemo knowledge base — browse the tree for orientation, but never auto-load content without the user asking.
---

# mnemo — Knowledge Base Skill

Uses the `mnemo` CLI (globally installed) for path resolution and the Read tool for file content. Never use `npx`.

## Commands

| Command              | Reference                   | Description                    |
| -------------------- | --------------------------- | ------------------------------ |
| `/mnemo list [path]` | `references/list.md`        | Browse the knowledge base tree |
| `/mnemo load <path>` | `references/load.md`        | Load notes into context        |
| (session start)      | `references/start.md`       | Menu presentation on new session |

When a command is invoked, read the matching reference file for full instructions before acting.

## Proactive use

When project config (CLAUDE.md, AGENTS.md) mentions a mnemo knowledge base directory:

- **Do:** run `mnemo list` to see what's available for orientation
- **Do:** mention relevant notes you spotted if they seem useful
- **Don't:** auto-load note content without the user asking or telling you to
- **Don't:** use mnemo if the project has no mention of a knowledge base
