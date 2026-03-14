# mnemo

A personal knowledge base for your AI tools.

Every AI tool starts cold. mnemo gives your agent access to your knowledge — conventions, research, preferences, domain expertise — so every session starts informed. You curate the notes, the agent retrieves what's relevant.

<!-- screenshot: Claude Code session showing menu + load flow -->

## Quick Start

Setup is CLI. Daily use is through your AI tool.

**1. Install**

```sh
npm install -g @mnemo2b/mnemo
```

**2. Connect a directory of markdown notes**

```sh
mnemo base add personal ~/notes
```

**3. Install the Claude Code skill**

```sh
claude skill add --file /path/to/mnemo/skill/SKILL.md
```

**Then in Claude Code:**

- Start a session — available knowledge sets appear as a numbered menu
- Pick a number to load, or ignore the menu and start working
- Browse your knowledge base: `/mnemo list`
- Load notes into context: `/mnemo load personal/react-patterns`
- Save new notes from conversation: `/mnemo save`

## How It Works

Your notes are plain markdown files in directories you already have. mnemo connects them to your AI tools.

- **Bases** give a name to a directory: `personal` points to `~/notes`
- **Sets** bundle paths into named groups you can load with one command
- Your AI agent browses and loads notes through the Claude Code skill — you just ask for what you need
- All paths are base-prefixed: `personal/code/react` = the `code/react` path inside the `personal` base
- Everything resolves to file paths. No database, no metadata, no lock-in.

## Bases

A base connects a directory to mnemo by name:

```sh
mnemo base add work ~/work/docs
mnemo base add personal ~/notes
```

You can connect as many directories as you want — personal notes, work docs, project research. All paths in mnemo are base-prefixed: `personal/code/react` means the `code/react` path inside `personal`.

```sh
mnemo base list              # show registered bases
mnemo base remove <name>     # unregister a base
mnemo base move <name> <path>   # change a base's directory
mnemo base rename <old> <new>   # rename a base
```

## Sets

A set bundles paths into a named group your agent can load at once:

```sh
mnemo set add react personal/react-patterns personal/typescript
```

Your agent loads it by name: `:react`

Sets are composable — they can include other sets by prefixing with `:`:

```sh
mnemo set add frontend personal/react-patterns personal/css :typescript
```

Set names support slash namespacing for organization: `code/react`, `work/onboarding`.

**Project-level sets** live in a `.mnemo` file in any directory:

```yaml
sets:
  stack:
    - personal/code/react
    - personal/code/typescript
```

Project sets override global sets on name collision.

```sh
mnemo set list               # show all sets (global + project)
mnemo set show <name>        # show resolved paths in a set
mnemo set remove <name>      # remove a set
```

## Claude Code

The primary experience. Install the skill and optionally add a session-start hook to see available sets when you begin a session.

**Skill commands:**

| Command | Description |
|---------|-------------|
| `/mnemo list [path]` | Browse the knowledge base tree |
| `/mnemo load <path>` | Load notes into context |
| `/mnemo save [path]` | Interactively save content from your conversation |

**Session menu:**

Add a hook to show available sets at the start of every session:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "mnemo menu"
      }
    ]
  }
}
```

This surfaces a numbered list of your sets with file counts and token costs. Pick a number to load, or just start working — the menu is optional.

## CLI Reference

The CLI is for setup and management. Run `mnemo --help` for the full list.

```
mnemo list [path]                 browse the knowledge base
mnemo load <path|:set ...>       resolve paths/sets to files
mnemo menu                        show sets with token counts
mnemo base <add|remove|move|rename|list>  manage bases
mnemo set <add|remove|show|list>          manage sets
```

## Configuration

**Global:** `~/.config/mnemo/config.yml`

```yaml
bases:
  personal: ~/notes
  work: ~/work/docs

sets:
  react:
    - personal/code/react
    - personal/code/typescript
  onboarding:
    - work/getting-started
    - :react
```

**Project:** `.mnemo` in any directory

```yaml
sets:
  stack:
    - personal/code/react
    - personal/code/typescript
```

Project sets override global sets when names collide.

## Development

Requires [Bun](https://bun.sh) for package management and running TypeScript directly.

```sh
bun install       # install dependencies
bun run build     # bundle to dist/
bun run typecheck  # check types
```

## License

MIT
