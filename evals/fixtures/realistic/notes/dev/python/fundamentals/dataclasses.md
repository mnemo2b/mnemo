# Dataclasses

Python's way to write boilerplate-free value classes. Generates `__init__`, `__repr__`, `__eq__` automatically.

## Basic

```python
from dataclasses import dataclass

@dataclass
class User:
    name: str
    age: int
    email: str = ""
```

Types are for documentation and tooling — not enforced at runtime.

## Defaults

```python
@dataclass
class Config:
    host: str = "localhost"
    port: int = 8080
    # mutable defaults need field()
    tags: list[str] = field(default_factory=list)
```

Mutable default via `field(default_factory=...)` — don't use `= []` directly, it's a shared reference.

## frozen

```python
@dataclass(frozen=True)
class Point:
    x: int
    y: int
```

Immutable, hashable, works as dict keys.

## slots

```python
@dataclass(slots=True)
class Point:
    x: int
    y: int
```

Uses `__slots__` — faster attribute access, less memory, no accidental new attrs.

## When to use vs alternatives

- **dataclass** — simple data holders, internal types
- **pydantic** — when you need runtime validation
- **attrs** — the predecessor, still widely used in libraries
- **namedtuple** — tiny, tuple-like, mostly replaced by dataclass
