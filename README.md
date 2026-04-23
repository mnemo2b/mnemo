# Mnemo

Mnemo connects your notes to Claude Code. Instead of re-explaining your preferences, conventions, and research every session, you save them to a knowledge base and load them.

You already have notes across folders. Project briefs, style guides, research, reading notes. Mnemo makes it easy to bring them into AI sessions and save new knowledge back. Currently built for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), more surfaces coming.

## The knowledge base

Mnemo is as much of a methodology as it is a tool. How you store your notes impacts how well they serve as context. Some structures are better than others for composing information without confusing the agent. Mnemo doesn't impose a specific structure, but it's designed to steer you towards better habits.

**One topic per note.** A client's brand guidelines shouldn't cover project scope. Your style guide doesn't also list research sources. Keeping notes to a single topic makes them more useful as AI context. It makes it easier for the agent to find and update, and it doesn't muddy the agent's attention.

**Structure for retrieval.** Mnemo can load folders of notes, making it easy to load larger subjects into context. Notes that belong in the same conversation should share a folder. `mnemo load clients/acme` pulls every note for that client. If this is a long-term client with many projects maybe `mnemo load clients/acme/projects/abc` is better.

**Learning is messy.** A topic might start as a single note. As it grows, it splits into multiple files, eventually becoming a directory. `research/ai.md` becomes `research/ai/prompt-engineering.md`, `research/ai/fine-tuning.md`. Over time the structure keeps dividing.

**Less is more.** You don't want to load all your notes, all the time. Stuffing everything into a conversation increases drift and hallucinations. Load only what's relevant to what you're doing right now. This is why structure is so important. Use the context window to your advantage by providing only what's crucial to the task.

## What it looks like

Say you have notes you've built up over time:

```
~/notes/
  clients/
    acme/
      brand-guidelines.md
      brief.md
    bloom/
      brief.md
      scope.md
  research/
    ai/
      agents.md
      fine-tuning.md
      prompt-engineering.md
    comms/
      content-strategy.md
      copywriting.md
      platforms.md
  templates/
    invoice.md
    proposal.md
  writing/
    articles/
      context-switching.md
      structuring-a-knowledge-base.md
    ideas.md
    voice.md
```

Point mnemo at it:

```sh
mnemo base add notes ~/notes
```

Now Claude Code knows about your knowledge base. Use the commands directly in the session:

```
> mnemo list notes/clients/acme

acme                                900
├── brand-guidelines.md             400
└── brief.md                        500

0 directories, 2 files (900 tokens)
```

And load notes into the conversation:

```
> mnemo load notes/clients/acme
```

Claude now has your Acme brief and brand guidelines in context. Ask it to draft copy that matches their voice, review a deliverable against the brief, or prep talking points for a client call.

You can also bundle notes from different places into a [set](#sets) and load them with one command:

```
> mnemo load :acme/project
```

This can load your Acme brief, brand guidelines, active tasks, templates, all at once. Useful for common groups of context, or something specific you're working on this week.

## Getting started

```sh
npm install -g @mnemo2b/mnemo
```

Connect a directory of markdown notes:

```sh
mnemo base add notes ~/notes
```

The first `mnemo base add` automatically sets up Claude Code with a startup hook, a skill, and agents that let Claude browse, load, and save to your knowledge base.

**Something not working?** Run `mnemo status` to check that everything is wired up. Run `mnemo install` to reinstall.

## Bases

A **base** is a named pointer to a directory. Connect as many as you want, wherever they live:

```sh
mnemo base add notes ~/notes
mnemo base add app ~/work/acme/web/docs
```

All paths in mnemo include the base name. `notes/clients/acme` means the `clients/acme` path inside the `notes` base.

```sh
mnemo base add <name> <path>       # connect a directory
mnemo base remove <name>           # disconnect
mnemo base move <name> <path>      # update the path
mnemo base rename <old> <new>      # rename (updates set references)
mnemo base list                    # show all bases
```

## Sets

A **set** bundles notes so you can load them with one command:

```sh
mnemo set add acme-project notes/clients/acme notes/templates/proposal
```

Now `mnemo load :acme-project` loads both. The `:` prefix tells mnemo it's a set, not a path.

Sets can pull from different bases and reference other sets:

```sh
mnemo set add writing-kit notes/writing/voice notes/writing/ideas
mnemo set add blog-post :writing-kit notes/research/comms/content-strategy
```

`:blog-post` builds on `:writing-kit`, so updating your writing notes updates both.

```sh
mnemo set add <name> <paths...>    # create or append
mnemo set remove <name>            # delete
mnemo set rename <old> <new>       # rename (updates references)
mnemo set show <name>              # show resolved paths
mnemo set list                     # show all sets
```

### Project sets

For project-specific context, drop a `.mnemo` file in any directory:

```yaml
# .mnemo
sets:
  context:
    - notes/clients/acme
    - notes/writing/voice
    - notes/templates/proposal
```

Start Claude Code from that directory and the set is available automatically. Commit the `.mnemo` file to share sets with a team.

## Saving notes

When a conversation surfaces something worth keeping, ask Claude to save it:

```
> save our content strategy findings to notes/research
```

Mnemo writes the note, checks for contradictions with existing notes, and flags related files that might need updating. You review, it writes.

Your knowledge base grows as you work without maintaining notes separately.

## How mnemo works with Claude Code

`mnemo install` sets up three things:

1. A **startup hook** that shows Claude your knowledge base at the beginning of every session: what bases you have, what's in them, what sets you've created. This lets Claude route "load my Acme notes" to the right path without searching your filesystem.

2. A **skill** that teaches Claude the `mnemo list`, `mnemo load`, and `mnemo save` commands.

3. **Agents** that handle specialized work like saving notes and maintaining knowledge base consistency.

The startup hook does the heavy lifting. Claude sees your knowledge base before it reads your first message, so it interprets questions with that context already in place.

For engineers: mnemo is composable by design. Plain markdown in directories you control. Bases are named pointers, sets are named path bundles, the CLI is the only programmatic interface. No database, no lock-in.

## CLI reference

```
mnemo list [path]                   browse the knowledge base
mnemo load <path|:set ...>          load notes into context
mnemo prime                         prime an agent with KB context
mnemo base <add|remove|move|rename|list>
mnemo set <add|remove|rename|show|list>
mnemo install [--force]             install skill + agents + session hook
mnemo uninstall                     remove skill + agents + session hook + config
mnemo status                        check install state and knowledge bases
```

## Configuration

Mnemo stores its configuration at `~/.config/mnemo/config.yml`. The `base` and `set` commands manage it for you.

Project-specific sets live in a `.mnemo` file in your project directory (see [project sets](#project-sets)).

## Uninstalling

Remove the skill, agents, session hook, and config:

```sh
mnemo uninstall
```

Then remove the package:

```sh
npm uninstall -g @mnemo2b/mnemo
```

This doesn't touch your notes, just mnemo's files.

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
