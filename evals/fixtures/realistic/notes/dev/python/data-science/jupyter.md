# Jupyter

Notebooks for exploration. Good for data work, bad for production code.

## When to use

- Exploratory data analysis
- Teaching / documentation with live code
- Iterating on a model or plot
- Sharing reproducible analyses

## When NOT to use

- Anything that needs version control beyond "last state"
- Code that other code imports
- Long-running pipelines (convert to script)
- Team-developed libraries

## Variants

- **Jupyter Notebook** — classic, single-user
- **JupyterLab** — IDE-like, tabs, file browser
- **VS Code notebooks** — best of both worlds, proper diff in git
- **Marimo** — reactive, like Observable; kills the stale-state problem
- **Deepnote / Hex / Observable** — hosted, collaborative

Lately I use Marimo or VS Code notebooks over classic Jupyter.

## Reproducibility

- Pin dependencies (`requirements.txt` or `pyproject.toml`)
- Run `Restart Kernel and Run All` before sharing
- Keep the notebook linear — don't run cells out of order and leave them that way
- `papermill` to parameterize and run notebooks as scripts

## Graduating out

When a notebook becomes important:
1. Extract functions into `.py` files
2. Import them back into the notebook
3. Convert the notebook into a script when it stops changing
