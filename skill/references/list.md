# /mnemo list

Run `mnemo list [path]` via Bash. Display the output directly — it's already formatted as a box-drawing tree with token counts.

**Directory or no input:**

```
personal
├── code                     4.2k
│   ├── react-patterns.md    1.8k
│   ├── typescript.md        1.6k
│   └── testing.md              800
├── research                 3.1k
│   ├── competitors.md       1.5k
│   └── market.md            1.6k
└── conventions                 600
    └── commit-style.md         600

3 directories, 6 files (7.9k tokens)
```

**Flags:**

- `--depth N` — limit display to N levels deep (token counts stay accurate regardless)
- `--no-tokens` — skip token counts for faster output
