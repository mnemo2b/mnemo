---
name: mnemo
description: Personal knowledge base powered by mnemo. Use when the user mentions "mnemo", "second brain", "knowledge base", or invokes /mnemo commands (list, load, save) to browse, read, or write notes. Also use proactively when project config (CLAUDE.md, AGENTS.md) references a mnemo knowledge base — browse the tree for orientation, but never auto-load content without the user asking.
---

# mnemo — Knowledge Base Skill

Three commands: `/mnemo list` (browse), `/mnemo load` (read), `/mnemo save` (write). Reading uses the `mnemo` CLI for path resolution and the Read tool for file content. Writing uses native file tools (Write, Edit).

## /mnemo list

Run `mnemo list [path]` via Bash. Display the output directly — it's already formatted as an indented tree.

**Directory or no input:**

```
product/
  docs/
    architecture.md
    schema.md
  features/
    list.md
    load.md
    skill.md
  roadmap/
    v0.md
  questions.md
```

**File target** — shows the parent directory tree with the targeted file marked with `→`:

```
product/
  docs/
    architecture.md
    schema.md
  features/
    list.md
    load.md
  → skill.md
  roadmap/
    v0.md
  questions.md
```

**Selection:** After showing results, wait for the user to respond with numbers or paths. Selecting a file loads it. Selecting a directory loads all files inside it. Accept space-separated (`2 4`), comma-separated (`2, 4`), or combined (`2,4`).

## /mnemo load

1. Run `mnemo list <path> --paths` via Bash to get one absolute file path per line
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

## /mnemo save

Save is always a multi-step conversation. Nothing writes to disk until the user approves.

1. **Interpret** — summarize what you think the user wants saved. Present for confirmation. No KB research yet.
2. **Research** — once confirmed, run `mnemo list` to explore the KB. Understand what exists, where things live, what's related.
3. **Propose one-by-one** — for each piece of content, present:
   - what you want to write
   - where it would go (new file or update to existing)
   - why you chose that location
   - the actual content (or diff for updates)
   - user approves, edits, or skips each one
4. **Save** — write each approved item using Write or Edit tools. After each save, confirm what was written and move to the next proposal.

For simple cases (user specifies exactly what and where), steps collapse — confirm and write.

### Note conventions

When writing notes, follow these rules:

- **Frontmatter:** YAML block with `title` and `description`
- **Filenames:** `descriptive-name.md` in kebab-case
- **Content:** one topic per note, natural length
- **Location:** the directory path is the organizational model
- **KB root:** read from `~/.config/mnemo/config.yml` (the `root` field)

```markdown
---
title: My Note Title
description: one-line summary for search results
---

Note content goes here.
```

## Proactive use

When project config (CLAUDE.md, AGENTS.md) mentions a mnemo knowledge base directory:

- **Do:** run `mnemo list` to see what's available for orientation
- **Do:** mention relevant notes you spotted if they seem useful
- **Don't:** auto-load note content without the user asking or telling you to
- **Don't:** use mnemo if the project has no mention of a knowledge base
