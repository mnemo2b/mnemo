# /mnemo list

Run `mnemo list [path]` via Bash. Display the output directly — it's already formatted as a box-drawing tree with token counts.

**Directory or no input:**

```
product
├── docs                  2.4k
│   ├── architecture.md   1.5k
│   ├── getting-started.md   400
│   └── schema.md            600
├── features              6.4k
│   ├── list.md              500
│   ├── load.md              300
│   └── skill.md             500
└── roadmap                  800
    └── v0.md                800

3 directories, 7 files (9.6k tokens)
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
