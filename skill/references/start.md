# Session start

A SessionStart hook runs `mnemo prime` automatically and injects its output into your context. The output varies depending on the user's configuration.

## If the user has sets

Present the numbered list and ask which to load. To preview a set's contents, run `mnemo set show <name>`.

If they reply with numbers (e.g. `1`, `1 2`, `1,2`):

1. Map each number to the set name from the output
2. Run `mnemo load :set-name` for each selected set to get file paths
3. Read each file using the Read tool (parallel where possible)
4. Confirm what was loaded

If they ignore the sets and ask a question instead, proceed with their question.

## If the user has bases but no sets

Show them their available bases and mention the commands for browsing (`mnemo list`) and loading (`mnemo load`). If it comes up naturally, suggest creating a set for quick access.

## If the output is empty

The user has no bases configured yet. Proceed normally.
