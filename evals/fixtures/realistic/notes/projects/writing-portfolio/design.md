# Writing Portfolio — Design

## Reference work

- **Craig Mod's site** — typography, restraint, quiet depth
- **Robin Sloan's site** — playfulness without sacrificing reading UX
- **Every Layout** — the composition model for CSS
- **Maggie Appleton** — visual essays, illustrations integrated with text
- **Pellicaan, Ev Chapman** — contemporary personal sites done well

## Choices I've made

- **No hero video / animation** on landing page
- **Content width** capped at ~680px for body, wider for code
- **One typeface for body** (Inter) — no second font for variety's sake
- **Display font** (Playfair) used only for post titles and landing
- **Monospace code** (JetBrains Mono)

## Layout

- Landing: intro, latest 3 essays, "what I'm working on"
- Essay index: chronological, title + date + read time, no excerpt
- Essay page: title, date, estimated read time, body, prev/next links
- Notes page: list of notes, shorter titles, denser layout

## Colors

- Light mode: warm off-white bg (#FAFAF7), near-black text (#1A1A1A)
- Dark mode: dark gray bg (#18181B), off-white text (#E8E8E5)
- Accent: one muted color (site-blue #2563EB) for links only

## Typography scale

- Body: 17px / 1.7 line height
- h1: 40px / 1.2 (display font)
- h2: 28px / 1.3
- h3: 20px / 1.4
- Small (meta, nav): 14px

## Accessibility

- 7:1 contrast ratio on body text (exceeds AAA)
- Semantic HTML throughout
- Prose never in columns (breaks flow)
- Alt text on every image
- Skip to content link
- Keyboard-navigable menus

## What I skipped

- Carousel of "featured" posts (decision fatigue, bounce driver)
- Sticky nav (distracts from reading)
- Animations beyond hover
- Third-party widgets (Twitter embeds, etc.)
