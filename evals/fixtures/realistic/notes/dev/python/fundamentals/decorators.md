# Decorators

Functions that take a function and return a new function. Syntactic sugar via `@`.

## Basic

```python
def log(fn):
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper

@log
def add(a, b):
    return a + b

add(1, 2)  # prints, then returns 3
```

`@log` is equivalent to `add = log(add)`.

## Preserve metadata

```python
from functools import wraps

def log(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper
```

Without `@wraps`, the wrapper replaces `__name__` and `__doc__`.

## Parameterized decorators

```python
def retry(times):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for _ in range(times):
                try:
                    return fn(*args, **kwargs)
                except Exception:
                    continue
        return wrapper
    return decorator

@retry(times=3)
def flaky():
    ...
```

Three levels of function — harder to read, more flexible.

## Class decorators

```python
def singleton(cls):
    instances = {}
    def wrapper(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return wrapper
```

## Built-ins worth knowing

- `@property` — compute attributes lazily
- `@classmethod`, `@staticmethod` — on classes
- `@functools.lru_cache` — memoization
- `@contextlib.contextmanager` — simple context managers
