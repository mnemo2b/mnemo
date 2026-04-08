# Git Rebasing

Rebase replays commits from one branch onto another, rewriting history to produce a linear sequence. The alternative is merge, which preserves the branch topology but creates merge commits.

## When to rebase

- cleaning up local commits before pushing — squash fixups, reorder, reword
- pulling upstream changes into a feature branch without merge commits
- maintaining a linear history that's easier to bisect and read

## When not to rebase

- after pushing to a shared branch — rewriting published history forces everyone to reset
- when the merge topology carries meaning (e.g. "this was a deliberate integration point")

## Interactive rebase

`git rebase -i HEAD~n` opens the last n commits for editing. Each line is a commit with an action: pick, squash, fixup, reword, edit, drop. Reordering lines reorders commits.
