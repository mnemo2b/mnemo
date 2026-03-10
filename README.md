# mnemo

Kool-aid for context.

Use a single knowledge base across your projects. Load only the context you need and nothing else.

## Installation

mnemo runs as an MCP server. You need [Node.js](https://nodejs.org) >= 18.

Build the server, then register it with your AI tool:

```sh
npm run build
```

### Register with Claude Code

```sh
claude mcp add mnemo -- node /absolute/path/to/mnemo/dist/mcp.mjs
```

### Configuration

Create a config file at `~/.config/mnemo/config.yml` pointing to your knowledge base:

```yml
root: ~/path/to/your/knowledge-base
```

## Usage

mnemo exposes two tools over MCP. AI tools call these automatically — you trigger them by asking questions about your knowledge base.

### `mnemo_list`

Browse the knowledge base by listing directory contents recursively. Pass a directory to see everything inside it, a file path to see its siblings, or nothing to list the full tree.

```
You: "What's in my knowledge base?"
→ mnemo_list() returns the full tree

You: "Show me what's in the product folder"
→ mnemo_list("product/") returns its recursive contents
```

### `mnemo_load`

Load notes into context. Pass a file path to load one note, or a directory path to load all notes inside it recursively. The `.md` extension is optional.

```
You: "Read the roadmap note"
→ mnemo_load("product/roadmap") returns the full markdown

You: "Load everything in core"
→ mnemo_load("core/") returns all notes in that directory
```

## Development

Requires [Bun](https://bun.sh) for package management and running TypeScript directly.

```sh
bun install              # install dependencies
bun run dev              # start the MCP server (stdio)
bun run build            # bundle to dist/
bun run typecheck        # type-check without emitting
```

For development, register the server pointing at source instead of the build:

```sh
claude mcp add mnemo -- bun run /absolute/path/to/mnemo/src/mcp.ts
```

## Project Structure

```
src/
  mcp.ts              # server entry — creates MCP server, registers tools, connects stdio
  config.ts            # reads kb root from ~/.config/mnemo/config.yml
  tools/
    list.ts            # mnemo_list — recursive directory browsing
    load.ts            # mnemo_load — note reading (files and directories)
dist/                  # build output (not committed)
tsdown.config.ts       # bundler config (esm, node platform)
```
