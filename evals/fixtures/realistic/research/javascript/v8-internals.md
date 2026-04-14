# Research: V8 Internals

## Question

What does a modern JS engineer actually need to know about V8 for performance intuition?

## Pipeline

1. **Parser** — source text → AST
2. **Ignition** — interpreter, compiles to bytecode, collects profiling info
3. **TurboFan** — optimizing compiler, kicks in on hot functions
4. **Sparkplug** — mid-tier baseline compiler (faster than Ignition, less work than TurboFan)
5. **Maglev** — newer mid-tier optimizer between Sparkplug and TurboFan

Hot functions get promoted to optimized code. Deoptimization sends them back when assumptions break.

## Hidden classes / shapes

Objects get "shapes" based on property layout:

```javascript
const a = { x: 1 };    // shape A
a.y = 2;               // shape A -> B
const b = { x: 3 };    // shape A
b.y = 4;               // shape A -> B (reused)
const c = { y: 5, x: 6 }; // different shape path
```

Property access is fast when shapes are stable and few. Dynamic property addition, deleting props, or mixing types fragments shapes and hurts performance.

## Inline caches (ICs)

V8 remembers object shapes at property access sites:
- **Monomorphic** — one shape seen — fast
- **Polymorphic** — 2-4 shapes — slower but still optimized
- **Megamorphic** — many shapes — falls back to generic lookup, slow

Implication: consistent object shapes at hot code paths compound.

## Deoptimizations

TurboFan optimizes based on observed behavior. When assumptions break:
- `+` seen as integer math → becomes string → deopt
- Array indexing assumes sparse → dense → deopt
- Monomorphic access site → new shape → deopt

Typically fine. Repeated deopts in a tight loop are a red flag.

## Practical implications

- Give objects their properties at construction in consistent order
- Avoid `delete` on hot objects (forces slow path)
- Keep types stable (don't mix string and number in the same field)
- Arrays: prefer dense (no holes) and homogeneous types
- Don't over-optimize without measuring

## Tools

- `--trace-opt`, `--trace-deopt` — V8 flags, see what's happening
- Chrome DevTools performance tab
- `%OptimizeFunctionOnNextCall` (non-production debug)

## Sources

- V8 blog (v8.dev)
- Benedikt Meurer's talks
- "Understanding V8 Internals" by Lars Bak (historical)
- HTML5Rocks performance articles
