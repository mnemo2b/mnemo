# Layout Grids

Grids give design consistency. But the grid should serve the content, not constrain it.

## 12-column

The default web grid. Divides into 2, 3, 4, 6, 12 — flexible for most layouts. Gutters of 16-32px depending on container width.

## Stack / cluster / sidebar primitives

Instead of forcing everything into columns:
- **Stack** — vertical rhythm with consistent spacing
- **Cluster** — horizontal wrapping groups (tags, buttons)
- **Sidebar** — main content + aside with responsive collapse
- **Switcher** — flip between row and column at a breakpoint

Every Layout has a composable implementation (see Heydon Pickering's book).

## Whitespace

- Whitespace is a design element, not wasted space
- Related content: tight spacing
- Unrelated content: lots of spacing
- Inconsistent spacing reads as sloppy even when users can't articulate why

## Alignment

- Pick an alignment per column and stick with it
- Left-align body text; center for short headings only
- Align to a baseline grid for dense layouts (magazines, documents)

## Breakpoints

Not mobile/tablet/desktop — design for the content. Add a breakpoint when the layout breaks. Common: ~640px, ~1024px, ~1280px.
