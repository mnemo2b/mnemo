---
name: mnemo
description: Personal knowledge base powered by mnemo. Use when the user mentions "mnemo", "second brain", "knowledge base", or invokes /mnemo commands (list, load) to browse and read notes. Also use proactively when project config (CLAUDE.md, AGENTS.md) references a mnemo knowledge base — browse the tree for orientation, but never auto-load content without the user asking.
---

# mnemo — Knowledge Base Skill

Two commands: `/mnemo list` (browse) and `/mnemo load` (read). Uses the `mnemo` CLI for path resolution and the Read tool for file content.

## /mnemo list

Run `mnemo list [path]` via Bash. Display the output directly — it's already formatted as a box-drawing tree with token counts.

**Directory or no input:**

```
product
├── docs                  2.4k
│   ├── architecture.md   1.5k
│   ├── getting-started.md   400
│   └── schema.md            600
├── features              6.4k
│   ├── list.md              500
│   ├── load.md              300
│   └── skill.md             500
└── roadmap                  800
    └── v0.md                800

3 directories, 7 files (9.6k tokens)
```

**File target** — shows the parent directory tree with the targeted file marked with `→`:

```
features
├── list.md              500
├── load.md              300
├── → skill.md           500
└── sqlite.md            500

0 directories, 4 files (1.8k tokens)
```

**Selection:** After showing results, wait for the user to respond with numbers or paths. Selecting a file loads it. Selecting a directory loads all files inside it. Accept space-separated (`2 4`), comma-separated (`2, 4`), or combined (`2,4`).

## /mnemo load

1. Run `mnemo load <path|:set>` via Bash to get one absolute file path per line
2. Read each file individually using the Read tool (parallel where possible)
3. Display only the summary confirmation, not the note content (the content is already in context)

Single file:

```
Loaded: zed/cheatsheet.md
```

Directory:

```
Loaded 3 notes:
- job/ai-engineer/profile.md
- job/ai-engineer/resources/bookmarks.md
- job/ai-engineer/resources/field-guide-notes.md
```

The `.md` extension is optional — `zed/cheatsheet` works the same as `zed/cheatsheet.md`.

## Proactive use

When project config (CLAUDE.md, AGENTS.md) mentions a mnemo knowledge base directory:

- **Do:** run `mnemo list` to see what's available for orientation
- **Do:** mention relevant notes you spotted if they seem useful
- **Don't:** auto-load note content without the user asking or telling you to
- **Don't:** use mnemo if the project has no mention of a knowledge base
