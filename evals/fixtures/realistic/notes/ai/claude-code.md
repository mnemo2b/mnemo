# Claude Code

Anthropic's CLI agent. What I've learned using it daily.

## Mental model

Not a chatbot in a terminal. It's an agent loop with tools (Read, Edit, Write, Bash, Grep, Glob, WebFetch, Agents). Give it tasks, it plans and executes.

## What works

- **Clear intent** — "refactor X to Y so Z is possible" beats "clean this up"
- **Context injection** — point it at files, it doesn't guess
- **Plans first, then execute** — reduces over-engineering
- **CLAUDE.md** — project-level instructions, always loaded

## Settings surface

- `settings.json` in `~/.claude/` (user) or `.claude/` (project)
- Hooks — SessionStart, UserPromptSubmit, etc. Run shell commands at lifecycle events.
- Skills — directory-based capabilities with references
- MCP servers — external tool servers via stdio/SSE

## Sessions

- Each `claude` invocation is a session with its own ID
- Sessions can be resumed (`--resume`)
- `CLAUDE_CONFIG_DIR` redirects config (useful for eval isolation)

## What I avoid

- Vague "fix this" without pointing at the problem
- Walls of text when a diff would be clearer
- Auto-approve mode without supervision on risky changes

## Debugging

- `--verbose` + `--output-format stream-json` shows the trajectory
- Trajectories replay tool calls — useful for evals and post-mortems
