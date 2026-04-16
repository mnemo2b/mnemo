---
name: mnemo
description: Personal knowledge base powered by mnemo. Use when the user mentions "mnemo", "second brain", "knowledge base", or asks to browse/load/save notes. Also use proactively when project config (AGENTS.md) references a mnemo knowledge base.
---

# mnemo — Knowledge Base Skill

Uses the `mnemo` CLI (globally installed) for path resolution and the Read tool for file content. Never use `npx`.

## Prime context

The primary entry to mnemo is the SessionStart hook (`mnemo prime`), which injects a `[mnemo]` system reminder with bases, sets, and a structure tree at session start. When present, route requests directly using that context — don't re-explore. Paths always start with a base name (`eval/cooking`, not `cooking`). If a path fails, run `mnemo list --depth 2` to reorient.

If the prime reminder isn't present, the hook isn't installed. You can still execute explicit `mnemo save` and `mnemo load` keyword commands using the references below, but routing from ambiguous phrasing ("my python", "my recipes") will miss — tell the user to run `mnemo setup` to install the hook.

## Reference files

- `references/list.md` — browsing the knowledge base tree
- `references/load.md` — loading notes into context

Read these when you need detailed instructions.

## Saving

Save requests route through `references/save.md`. Read it before any tool use on knowledge-base files. Do not Read, Write, or Edit KB files directly, and do not distill content yourself. Save runs as a sub-agent because voice, routing, and refactor judgment live there, not in this skill.

Save signals: explicit ("save this to X"), open-ended ("capture this", "save what we discussed"), or any user request to write to the knowledge base.

## Proactive use

When project config (AGENTS.md) mentions a mnemo knowledge base:

- **Do:** run `mnemo list` to see what's available for orientation
- **Do:** mention relevant notes you spotted if they seem useful
- **Don't:** auto-load note content without the user asking
- **Don't:** use mnemo if the project has no mention of a knowledge base
