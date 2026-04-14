# FastAPI

Async web framework built on Starlette + Pydantic. Type hints drive validation, serialization, and OpenAPI docs.

## Hello world

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"ok": True}
```

Run: `uvicorn main:app --reload`

## Path parameters

```python
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id}
```

Type annotation → validation. `int` means non-int paths return 422.

## Request bodies

```python
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int

@app.post("/users")
async def create_user(user: User):
    return user
```

Pydantic parses/validates the JSON body. Auto-generates OpenAPI schema.

## Dependency injection

```python
def get_db():
    db = connect()
    try:
        yield db
    finally:
        db.close()

@app.get("/items")
async def list_items(db = Depends(get_db)):
    return db.query(Item).all()
```

Clean way to handle DB sessions, auth, config.

## Async

Endpoints can be sync or async. FastAPI handles both. Use async for I/O (DB, HTTP); sync is fine for CPU-bound.

## Testing

```python
from fastapi.testclient import TestClient

client = TestClient(app)
res = client.get("/users/1")
assert res.status_code == 200
```
