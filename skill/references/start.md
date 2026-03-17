# Session start

A SessionStart hook runs `mnemo menu` automatically and injects its output into your context. When you see menu output, present it to the user and wait for their selection.

## What the user sees

```
mnemo sets available:
 1. react — 3 notes, 1.2k tokens [global]
 2. stack — 5 notes, 3.4k tokens [project]

Reply with numbers to load, or just start working.
```

## When the user picks

If the user replies with numbers (e.g. `1`, `1 2`, `1,2`):

1. Map each number to the set name from the menu
2. Run `mnemo load :set-name` for each selected set to get file paths
3. Read each file using the Read tool (parallel where possible)
4. Confirm what was loaded

If the user ignores the menu and asks a question instead, proceed with their question — the menu is optional.
