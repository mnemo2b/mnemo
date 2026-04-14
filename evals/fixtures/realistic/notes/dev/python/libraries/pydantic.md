# Pydantic

Data validation via type hints. Core library for FastAPI, config management, LLM tool I/O.

## Models

```python
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    email: str
    tags: list[str] = []

user = User(id=1, name="alice", email="a@x.com")
# raises ValidationError if types don't match
```

## v2 changes

Massive rewrite. Key changes:
- 5-50x faster (rust-backed core)
- `.model_dump()` replaces `.dict()`
- `.model_validate()` replaces parsing via constructor
- Field validators: `@field_validator` instead of `@validator`

## Custom validation

```python
from pydantic import field_validator

class User(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("not an email")
        return v
```

## Settings

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    debug: bool = False

    class Config:
        env_file = ".env"
```

Reads from env vars, `.env` files, or both. Types are enforced.

## Serialization

```python
user.model_dump()           # dict
user.model_dump_json()      # JSON string
user.model_dump(exclude={"email"})
user.model_dump(by_alias=True)
```

## vs dataclasses

- **dataclass** — simple, no validation, stdlib
- **pydantic** — validation, coercion, JSON schema, more dependencies
