# /mnemo load

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
