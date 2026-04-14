# Shell

Zsh with Starship prompt, fzf, ripgrep. Aliases earn their keep when you use them daily.

## Essential one-liners

```bash
# recursive grep
rg "pattern" --type ts

# files modified in the last day
fd --changed-within 1d

# interactive process kill
ps aux | fzf | awk '{print $2}' | xargs kill

# jump to project
z <partial-name>   # via zoxide

# history with fuzzy search
<ctrl-r>  # via fzf
```

## Aliases worth having

```bash
alias ll="ls -lah"
alias gst="git status"
alias gco="git checkout"
alias gp="git push"
alias gpl="git pull --rebase"
alias dr="docker"
alias drc="docker compose"
alias k="kubectl"
```

## Functions vs aliases

- Alias: simple substitution
- Function: takes arguments, has logic

```bash
mkcd() {
  mkdir -p "$1" && cd "$1"
}
```

## Tools that compounded

- **fzf** — fuzzy finder, binds to ctrl-r, ctrl-t, alt-c
- **rg (ripgrep)** — fast grep with sensible defaults
- **fd** — fast find with sensible defaults
- **bat** — cat with syntax highlighting
- **zoxide** — `z` command, jump to directories by partial name
- **starship** — configurable prompt, same config across shells
- **direnv** — per-directory env vars via `.envrc`

## Don't bother

- Heavy framework prompts (oh-my-zsh) — slow, 90% unused
- Giant alias files you never remember
