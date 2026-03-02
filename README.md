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

### `mnemo_find`

Browse the knowledge base by directory path. Pass a directory to list its contents, a file path to see its siblings, or nothing to list the top-level directories.

```
You: "What's in my knowledge base?"
→ mnemo_find() returns top-level directories

You: "Show me what's in the product folder"
→ mnemo_find("product/") returns its contents
```

### `mnemo_load`

Load a note's full content. Use this after `mnemo_find` to read a specific note.

```
You: "Read the roadmap note"
→ mnemo_load("product/roadmap.md") returns the full markdown
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
    find.ts            # mnemo_find — directory browsing
    load.ts            # mnemo_load — note reading
dist/                  # build output (not committed)
tsdown.config.ts       # bundler config (esm, node platform)
```
