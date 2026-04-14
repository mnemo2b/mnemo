# SQLAlchemy

Python's de facto ORM. Two layers: Core (SQL expression language) and ORM (declarative mapping).

## 2.0 style

```python
from sqlalchemy import create_engine, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str | None]
```

## Sessions

```python
from sqlalchemy.orm import Session

engine = create_engine("postgresql://...")

with Session(engine) as session:
    user = User(name="alice", email="a@x.com")
    session.add(user)
    session.commit()
```

## Queries

```python
from sqlalchemy import select

stmt = select(User).where(User.name == "alice")
user = session.scalars(stmt).first()
```

`select()` is the 2.0 way. Old `session.query()` is deprecated.

## Relationships

```python
class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    user: Mapped[User] = relationship(back_populates="posts")
```

## Async

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

engine = create_async_engine("postgresql+asyncpg://...")
```

Everything else looks similar but with `await`.

## Alembic

Schema migrations. Not optional for production apps.
