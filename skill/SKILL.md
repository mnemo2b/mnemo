---
name: 2b
description: Personal knowledge base ("second brain") powered by mnemo. Use when the user mentions "mnemo", "2b", "second brain", or invokes /2b commands (find, load, save) to browse, read, or write notes. Also use proactively when project config (CLAUDE.md, AGENTS.md) references a mnemo knowledge base — browse the tree for orientation, but never auto-load content without the user asking.
---

# 2b — Knowledge Base Skill

Three commands: `/2b find` (browse), `/2b load` (read), `/2b save` (write). All reading goes through the mnemo MCP server tools (`mnemo_find`, `mnemo_load`, `mnemo_tree`). All writing uses native file tools (Write, Edit).

## /2b find

Call `mnemo_find` with the user's input. Format the results as follows.

**Directory or no input** — show numbered list, directories first then files. Files show title and description from the results:

```
product/
  1. docs/
  2. features/
  3. roadmap/
  4. questions.md    "Questions" — resolved + open design questions
  5. readme.md       "Product Directory" — how the product docs are organized
```

When no input is given (root listing), omit the header directory:

```
  1. core/
  2. product/
  3. research/
```

**File target** — show the parent directory with all siblings. Mark the targeted file (where `match: true`) with `→`:

```
product/
  1. docs/
  2. features/
  3. roadmap/
→ 4. questions.md    "Questions" — resolved + open design questions
  5. readme.md       "Product Directory" — how the product docs are organized
```

Directories end with `/`. Files without a title or description show the path only.

**Selection:** After showing results, wait for the user to respond with numbers. Selecting a file loads it. Selecting a directory runs find on it. Accept space-separated (`2 4`), comma-separated (`2, 4`), or combined (`2,4`).

## /2b load

Call `mnemo_load` with the path. Display the returned content with a confirmation:

```
---
[note content]
---

Loaded: core/philosophy.md
```

When loading multiple notes:

```
---
[note 1 content]
---

---
[note 2 content]
---

Loaded 2 notes:
- core/philosophy.md
- core/principles.md
```

## /2b save

Save is always a multi-step conversation. Nothing writes to disk until the user approves.

1. **Interpret** — summarize what you think the user wants saved. Present for confirmation. No KB research yet.
2. **Research** — once confirmed, use `mnemo_find` to explore the KB. Understand what exists, where things live, what's related.
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

- **Do:** call `mnemo_tree` to see what's available for orientation
- **Do:** mention relevant notes you spotted if they seem useful
- **Don't:** auto-load note content without the user asking or telling you to
- **Don't:** call mnemo tools if the project has no mention of a knowledge base
