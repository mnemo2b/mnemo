# Color Systems

Moving beyond ad-hoc hex codes.

## Tokens, not raw values

```css
--color-text-primary: var(--gray-900);
--color-text-secondary: var(--gray-600);
--color-surface: var(--gray-50);
```

Two layers: primitives (gray-50, blue-500) and semantic tokens (bg-surface, text-primary). Components reference semantic tokens; primitives are the palette.

## Scales

Each color needs 9-12 stops. Tailwind's scale (50-950) is a solid default.

## Light / dark

Flip semantic tokens, keep primitives. Done right, theming is a variable change, not a rewrite.

## Accessibility

- 4.5:1 contrast for body text (WCAG AA)
- 3:1 for large text and UI components
- Never rely on color alone — add icons, text, patterns
- Test with a color blindness sim

## Pitfalls

- **Gray is a color** — use cool or warm grays intentionally
- **Pure black is too harsh** — #000 rarely looks right; use #0A0A0A or a slightly warmer tone
- **Accent colors dominate** — reserve saturation for calls to action
- **Too many brand colors** — 1 primary, 1-2 accents, a neutral scale
