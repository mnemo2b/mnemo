# mnemo

If you find yourself repeating the same instructions, explaining the same architectures, rebuilding the same context, you should try mnemo.

It's a context layer for AI tools, backed by markdown files you probably already have. Connect your directories, create sets, and start sessions with exactly the context you need.

No database, no metadata, no maintenance. Just a simple way of bringing notes into an AI session.

Currently built for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). More surfaces coming.

## Quick Start

```sh
npm install -g @mnemo2b/mnemo
```

Point mnemo at a directory of markdown notes:

```sh
mnemo base add notes ~/notes
```

Install the Claude Code skill and session hook:

```sh
mnemo setup
```

That's it. Next time you start a Claude Code session you'll be able to browse and load from your knowledge base. To get more out of mnemo, bundle paths into sets so you can load specific context with one command.

**In Claude Code:**

There are commands for browsing (`mnemo list`) and loading (`mnemo load`):

```
mnemo                   view your set list
mnemo list              browse your knowledge bases
mnemo list work/docs    browse a specific directory
mnemo load :react       load a set into context
mnemo load work/docs    load a directory into context (works for files too)
```

## How It Works

mnemo has two concepts: **bases** and **sets**.

A **base** is a named pointer to a directory. You probably already have folders of notes, docs, or research — mnemo just gives them a name so it can find them.

```sh
mnemo base add work ~/work/docs
mnemo base add personal ~/notes
```

All paths in mnemo are base-prefixed: `personal/code/react` means the `code/react` path inside the `personal` base.

A **set** bundles paths into a group you can load with one command:

```sh
mnemo set add react personal/code/react-patterns personal/code/typescript
```

Now `mnemo load :react` loads both. Sets are composable — they can reference other sets:

```sh
mnemo set add frontend :react personal/code/css personal/code/accessibility
```

Everything resolves to file paths on disk.

## Bases

Knowledge bases you want to access with mnemo.

```sh
mnemo base add <name> <path>       # connect a directory
mnemo base remove <name>           # disconnect
mnemo base move <name> <path>      # point to a new directory
mnemo base rename <old> <new>      # rename (updates global set paths)
mnemo base list                    # show all bases
```

Renaming a base automatically updates global set paths that reference it. Project `.mnemo` files aren't updated — edit those manually.

## Sets

Named collections of notes for re-use.

```sh
mnemo set add <name> <paths...>    # create or append paths to a set
mnemo set remove <name>            # delete a set
mnemo set rename <old> <new>       # rename (updates global references)
mnemo set show <name>              # show resolved paths
mnemo set list                     # show all sets (global + project)
```

Set names support slashes for namespacing: `code/react`, `work/onboarding`.

### Project sets

For creating project-specific sets or sharing with others. Drop a `.mnemo` file in a project to define project-specific sets. If you start your Claude session from within that directory your sets will get picked up.

```yaml
# .mnemo
sets:
  stack:
    - personal/code/react
    - personal/code/typescript
    - work/project-guidelines
```

_Project sets override global sets when names collide._

## Claude Code

`mnemo setup` installs two things:

- **Skill** — gives Claude the `mnemo list` and `mnemo load` commands
- **Session hook** — shows your available sets when you start a session

The session menu shows set names, file counts, and token costs so you know what you're loading before you load it. Pick a number or keep working — the menu is there when you want it.

| Command                    | What it does                   |
| -------------------------- | ------------------------------ |
| `mnemo list [path]`       | Browse the knowledge base tree |
| `mnemo load <path\|:set>` | Load notes into context        |

## CLI Reference

```
mnemo list [path]                   browse the knowledge base
mnemo load <path|:set ...>          resolve paths/sets to files
mnemo menu                          show sets with token counts
mnemo base <add|remove|move|rename|list>
mnemo set <add|remove|rename|show|list>
mnemo setup                         install skill + session hook
```

## Configuration

**Global** — `~/.config/mnemo/config.yml`

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

**Project** — `.mnemo` in any directory

```yaml
sets:
  stack:
    - personal/code/react
    - personal/code/typescript
```

## Writing Good Notes

mnemo doesn't impose a structure, it reads directories of markdown files. Still, it might change the way you think about organizing your notes. A few things work well:

- **One topic per note**, at whatever length it needs. Not atomic fragments, not kitchen-sink docs.
- **Shallow hierarchies.** `research/competitors/` over `research/tools/ai/note-taking/competitors/`.
- **Organize around how you'll load.** Loading a full directory is common, so notes that share context should share a folder. Sometimes a whole folder is the right move, sometimes a set pulling from three bases is better. Learn what works for you.
- **Be deliberate with context.** A context window full of loosely related content makes your AI less precise, not more capable. Loading exactly what's relevant keeps the signal high and gives the model less room to drift.

## Development

Requires [Bun](https://bun.sh) for development. Published package runs on Node.js 18+.

```sh
bun install         # install dependencies
bun run build       # bundle to dist/
bun run typecheck   # check types
bun test            # run tests
```

## License

MIT
