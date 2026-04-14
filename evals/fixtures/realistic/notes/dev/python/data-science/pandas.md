# Pandas

DataFrames for Python. Works well for anything that fits in memory (up to ~few GB).

## DataFrame basics

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df.head()
df.info()
df.describe()
```

## Selection

```python
df["col"]              # Series
df[["col1", "col2"]]   # DataFrame
df.loc[0]              # row by label
df.iloc[0]             # row by position
df[df["age"] > 30]     # boolean filter
```

## Common operations

```python
# groupby + aggregate
df.groupby("country")["sales"].sum()

# pivot
df.pivot_table(index="month", columns="product", values="sales", aggfunc="sum")

# join
merged = df1.merge(df2, on="id", how="left")

# missing data
df.fillna(0)
df.dropna()
```

## Performance

- Use vectorized ops, not `.apply` with a Python function (slow)
- Categorical dtype for low-cardinality strings (massive memory savings)
- Specify dtypes in read_csv when columns are known

## When pandas isn't enough

- **Polars** — faster, multithreaded, eager/lazy APIs. Similar syntax.
- **DuckDB** — SQL on DataFrames, great for analytics
- **Dask / Modin** — distributed for out-of-memory data
- **PyArrow** — columnar backend, modern pandas uses it optionally

For new projects I'd reach for polars unless pandas interop is required.
