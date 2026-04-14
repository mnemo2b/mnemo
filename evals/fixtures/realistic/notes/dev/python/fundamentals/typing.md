# Python Typing

Type hints (PEP 484+). Optional at runtime; enforced by tools (mypy, pyright, ruff).

## Basics

```python
def add(a: int, b: int) -> int:
    return a + b

name: str = "alice"
count: int = 0
```

## Built-in generics (3.9+)

```python
# old
from typing import List, Dict
users: List[Dict[str, int]] = []

# new (preferred)
users: list[dict[str, int]] = []
```

## Union / optional

```python
# 3.10+
def find(id: int) -> User | None:
    ...

# older
from typing import Optional, Union
def find(id: int) -> Optional[User]:
    ...
```

`X | None` is idiomatic. `Optional[X]` is the same thing, older syntax.

## TypedDict

```python
from typing import TypedDict

class UserDict(TypedDict):
    name: str
    age: int
```

For dicts with known keys. Less strict than dataclass, preserves dict semantics.

## Protocols (structural typing)

```python
from typing import Protocol

class Readable(Protocol):
    def read(self) -> bytes: ...

def consume(f: Readable) -> None:
    data = f.read()
```

Duck typing with type hints. Anything with a `read() -> bytes` method satisfies `Readable`.

## Generics

```python
from typing import TypeVar

T = TypeVar('T')

def first(items: list[T]) -> T:
    return items[0]
```

## Tooling

- **mypy** — the OG, strict mode recommended
- **pyright** — Microsoft, faster, stricter by default, powers Pylance in VS Code
- **ruff** — linter with type-aware rules, complements the above
