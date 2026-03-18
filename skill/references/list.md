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

**File target** — shows the parent directory tree with the targeted file marked with `→`:

```
features
├── list.md              500
├── load.md              300
├── → skill.md           500
└── sqlite.md            500

0 directories, 4 files (1.8k tokens)
```

**Selection:** After showing results, wait for the user to respond with numbers or paths. Selecting a file loads it. Selecting a directory loads all files inside it. Accept space-separated (`2 4`), comma-separated (`2, 4`), or combined (`2,4`).
