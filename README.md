# mnemo

Tools for leveraging knowledge bases as AI context. (for Claude Code)

- Load files, folders, or predefined sets of notes into your AI sessions.
- Sets give quick access to load commonly used context additions.
- Access multiple knowledge bases simultaneously.

## Quick Start

Setup via CLI. Daily use is through your AI tool.

**1. Install**

```sh
npm install -g @mnemo2b/mnemo
```

**2. Connect a knowledge base of markdown notes**

```sh
mnemo base add notes ~/notes
```

**3. Set up Claude Code integration**

```sh
mnemo setup
```

**Then in Claude Code:**

- Start a session — available sets appear as a numbered menu
- Pick a number to load, or ignore the menu and start working
- Browse your knowledge base: `/mnemo list`
- Load notes into context: `/mnemo load personal/react-patterns`

## How It Works

Your notes are plain markdown files in directories you already have. mnemo makes them easy to inject into your AI workflows.

- **Bases** give a name to a directory: `personal` points to `~/notes`
- **Sets** bundle paths into named groups you can load with one command
- Your AI agent browses and loads notes through the Claude Code skill — you just ask for what you need
- All paths are base-prefixed: `personal/code/react` = the `code/react` path inside the `personal` base
- Everything resolves to file paths. No database, no metadata, no lock-in.

## Bases

A base connects a directory to mnemo by name:

```sh
# base add <name> <path>
```

```sh
mnemo base add work ~/work/docs
mnemo base add personal ~/notes
```

You can connect as many directories as you want — personal notes, work docs, project research. All paths in mnemo are base-prefixed: `base/code/react` means the `code/react` path inside `base`.

```sh
mnemo base list                 # list all bases
mnemo base remove <name>        # stop tracking a base
mnemo base move <name> <path>   # change a base's directory
mnemo base rename <old> <new>   # rename a base (updates global set paths)
```

Renaming a base automatically updates any global set paths that reference it. Project `.mnemo` files are not updated — edit those manually.

## Sets

A set bundles paths into a named group your agent can load at once:

```sh
# mnemo set add <name> <path>[]
```

```sh
mnemo set add react kb/react-patterns kb/typescript
```

Now you can load the set by name: `:react`

```sh
# Claude Code
mnemo load :react
```

```sh
mnemo set list               # show all sets (global + project)
mnemo set show <name>        # show resolved paths in a set
mnemo set remove <name>      # remove a set
mnemo set rename <old> <new> # rename a set (updates global references)
```

Renaming a set automatically updates any global sets that reference it via `:old-name`. Project `.mnemo` files are not updated — edit those manually.

### Composable

Sets are composable — they can include other sets:

```sh
mnemo set add frontend personal/react/patterns personal/css project/design-patterns :typescript
```

Set names support slash namespacing for organization: `code/react`, `work/writing`.

### Project sets

mnemo supports project-level sets that live in a `.mnemo` file:

```yaml
sets:
  stack:
    - personal/code/react
    - personal/code/typescript
    - work/docs
```

Project sets override global sets on name collision.

## Claude Code

The mnemo experience was primarily built for Claude Code. Run `mnemo setup` to install the skill and session-start hook automatically.

```sh
mnemo setup
```

This installs two things:

- **Skill** — copies to `~/.claude/skills/mnemo/`, giving Claude the `/mnemo list` and `/mnemo load` commands
- **Session hook** — adds a `SessionStart` entry to `~/.claude/settings.json` that shows available sets when you begin a session

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `/mnemo list [path]` | Browse the knowledge base tree |
| `/mnemo load <path>` | Load notes into context        |

The session menu surfaces a numbered list of your sets with file counts and token costs. Pick a number to load, or just start working — the menu is optional.

## CLI Reference

The CLI is primarily for setup and management. Run `mnemo --help` for the full list.

```
mnemo list [path]                           browse the knowledge base
mnemo load <path|:set ...>                  resolve paths/sets to files
mnemo menu                                  show sets with token counts
mnemo base <add|remove|move|rename|list>    manage bases
mnemo set <add|remove|rename|show|list>     manage sets
mnemo setup                                 install skill + session hook
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
bun install         # install dependencies
bun run build       # bundle to dist/
bun run typecheck   # check types
bun test            # run tests
```

## License

MIT

# TODO

- Add knowledge base organization section
- When a set is defined, ONLY get sets, never search for directories on your own
