# mnemo

If chatting with AI has you repeating the same instructions, explaining the same architectures, rebuilding the same context, try mnemo.

It's a composable way to bring your markdown notes into AI. You probably already have tons of notes, conventions, research. mnemo adds these as context to guide your conversation.

Currently built for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), more surfaces coming.

## What it looks like

Say you have a directory of notes you've built up over time:

```
~/notes/
  code/
    svelte/
      architecture.md
      components.md
      state.md
    nextjs/
      routing.md
      architecture.md
    typescript/
      patterns.md
      errors.md
    api/
      design.md
      auth.md
      errors.md
  db/
    drizzle.md
    postgres.md
    redis.md
  reading/
    designing-data-intensive-apps.md
    philosophy-of-software-design.md
```

Point mnemo at it:

```sh
mnemo base add notes ~/notes
```

Now when you start a Claude Code session, you can browse and load your notes:

```
> mnemo list notes/code/svelte

svelte                       1.8k
├── architecture.md             800
├── components.md               600
└── state.md                    400

0 directories, 3 files (1.8k tokens)
```

```
> mnemo load notes/code/svelte
```

Claude now has your Svelte architecture, component patterns, and state management notes in context. No copy-pasting, no re-explaining. Just your knowledge, loaded when you need it.

You can also combine notes from different places into a [set](#sets):

```
> mnemo load :svelte
```

That one command loads your Svelte patterns and TypeScript conventions together.

## Getting started

```sh
npm install -g @mnemo2b/mnemo
```

Connect a directory of markdown notes:

```sh
mnemo base add notes ~/notes
```

If you use Claude Code, install the skill:

```sh
mnemo setup
```

Next time you start a session, you can browse your notes with `mnemo list` and load them with `mnemo load`. Once you create sets, a menu will appear at session start and you can load one by picking a number.

## Bases

A **base** is a named pointer to a directory. Connect as many as you want, wherever they live:

```sh
mnemo base add notes ~/notes
mnemo base add work ~/work/docs
```

All paths in mnemo include the base name: `notes/code/svelte` means the `code/svelte` path inside the `notes` base. This keeps things unambiguous when you have multiple knowledge sources.

```sh
mnemo base add <name> <path>       # connect a directory
mnemo base remove <name>           # disconnect
mnemo base move <name> <path>      # update the path
mnemo base rename <old> <new>      # rename (updates set references)
mnemo base list                    # show all bases
```

## Sets

A **set** saves a combination of notes so you can load them again with one command. Say you load the same Svelte and TypeScript notes for every frontend project:

```sh
mnemo set add svelte notes/code/svelte notes/code/typescript
```

Now `mnemo load :svelte` loads both (the `:` tells mnemo it's a set, not a path). You can also pull from different places. Starting a Svelte project that uses Postgres?

```sh
mnemo set add svelte/stack :svelte notes/db/postgres notes/db/drizzle
```

```
> mnemo load :svelte/stack
```

Sets can reference other sets. `:svelte/stack` already builds on `:svelte` above, so updating your Svelte notes updates both.

```sh
mnemo set add <name> <paths...>    # create or append
mnemo set remove <name>            # delete
mnemo set rename <old> <new>       # rename (updates references)
mnemo set show <name>              # show resolved paths
mnemo set list                     # show all sets
```

### Project sets

For project-specific context or sharing with a team. Drop a `.mnemo` file in any directory:

```yaml
# .mnemo
sets:
  stack:
    - notes/code/svelte
    - notes/code/typescript
    - work/conventions
```

Start a Claude Code session from that directory and the set is available automatically. Project sets override global sets when names collide.

## Claude Code

`mnemo setup` installs two things:

- A **skill** that teaches Claude the `mnemo list` and `mnemo load` commands
- A **session hook** that shows your available sets when you start a session

The session menu shows set names, file counts, and token costs so you know what you're loading before you load it. Pick a number or keep working. The menu is there when you want it.

## Organizing your notes

mnemo reads directories of markdown files. It doesn't impose a structure, but the way you organize your notes shapes how useful they are in context.

**One topic per note,** at whatever length it needs. A note about Svelte component patterns doesn't also cover state management. Focused notes let you load exactly what's relevant, and a clear structure helps the agent know where new notes belong.

**Structure around how you'll load.** Loading a full directory is common, so notes that belong in the same conversation should share a folder. `mnemo load notes/code/svelte` pulls everything in that directory.

**Start messy, organize later.** A topic can start as a single note inside an existing folder. As it grows, it splits into files, becomes a subdirectory. `code/svelte.md` becomes `code/svelte/architecture.md`, `code/svelte/components.md`. Structure emerges from use, not upfront planning.

**Be deliberate with context.** A context window full of loosely related notes makes AI less precise, not more capable. Loading exactly what's relevant keeps the signal high.

## CLI reference

```
mnemo list [path]                   browse the knowledge base
mnemo load <path|:set ...>          load notes into context
mnemo prime                         prime an agent with available sets
mnemo base <add|remove|move|rename|list>
mnemo set <add|remove|rename|show|list>
mnemo setup                         install skill + session hook
```

## Configuration

**Global** — `~/.config/mnemo/config.yml`

```yaml
bases:
  notes: ~/notes
  work: ~/work/docs

sets:
  svelte:
    - notes/code/svelte
    - notes/code/typescript
  svelte/stack:
    - :svelte
    - notes/db/postgres
    - notes/db/drizzle
```

**Project** — `.mnemo` in any directory

```yaml
sets:
  stack:
    - notes/code/svelte
    - notes/code/typescript
    - work/conventions
```

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
