# Git Rebasing

Rewrite history — cleaner logs, easier PR reviews, fewer merge commits. Powerful enough to lose work if you're careless.

## Linear history

```
git rebase main
```

Replays your commits on top of main. Result: linear history, no merge commit. Use on your feature branch before opening a PR.

## Interactive rebase

```
git rebase -i HEAD~5
```

Opens an editor to:
- `pick` — keep commit
- `reword` — change message
- `squash` — merge into previous (keep message)
- `fixup` — merge into previous (drop message)
- `edit` — pause to amend
- `drop` — delete

Use to clean up messy commits before merging.

## Autosquash

```
git commit --fixup=abc123
git rebase -i --autosquash main
```

Automatically stages fixup commits in the right places. Massive quality-of-life improvement.

## Rules

- **Never rebase shared branches** (main, develop). Rebase your own topic branch only.
- **Before force-push**, verify you're pushing what you think: `git log origin/branch..HEAD`
- **Use `--force-with-lease`**, not `--force` — refuses if someone else pushed in the meantime
- **When conflicts happen**, fix them, `git add`, `git rebase --continue`

## Recovery

```
git reflog
git reset --hard HEAD@{2}
```

Reflog tracks HEAD changes locally. Can undo almost any rebase mistake within 90 days.
