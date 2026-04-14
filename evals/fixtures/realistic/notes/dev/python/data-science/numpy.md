# NumPy

N-dimensional arrays, fast math, the foundation for the scientific Python stack.

## Arrays

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.zeros((3, 4))       # 3x4 zeros
c = np.arange(0, 10, 0.5)  # 0 to 10, step 0.5
d = np.linspace(0, 1, 100) # 100 evenly spaced
```

## Vectorized operations

```python
a + b      # elementwise
a * 2      # broadcast scalar
np.dot(a, b)  # matrix multiply (or @ operator)
```

Loops are slow. Express operations as array math.

## Broadcasting

```python
a = np.array([[1, 2], [3, 4]])  # 2x2
b = np.array([10, 20])           # 1x2
a + b                            # broadcasts b across rows
```

Rules: align shapes from the right; size 1 dims stretch; mismatched dims error.

## Shape manipulation

```python
a.reshape(4, 1)
a.T            # transpose
a.flatten()
a.squeeze()    # remove size-1 dims
np.stack([a, b])
np.concatenate([a, b], axis=0)
```

## Indexing

```python
a[0]          # first row
a[:, 0]       # first column
a[a > 5]      # boolean mask
a[[0, 2]]     # fancy indexing
```

## Random

```python
rng = np.random.default_rng(seed=42)
rng.normal(0, 1, size=100)
rng.integers(0, 10, size=(3, 3))
```

Always use `default_rng()` for reproducibility — legacy `np.random.seed` is global and risky.
