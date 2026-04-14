# Writing Portfolio

Personal site hosting my essays, notes, and longer pieces. Rebuilt from scratch every few years.

## Goals

- Reading-first layout (not Twitter-style feed)
- Fast — static site, no analytics trackers, no heavy frameworks
- Writing UX so good I actually write
- Longevity — content in markdown, site generator swappable

## Stack

- Astro (SSG, Svelte islands for interactive bits)
- Markdown with frontmatter for posts
- Tailwind for styling, with overrides for the typography
- Hosted on Cloudflare Pages

## Why Astro

- Ships zero JS by default
- MDX support for interactive essays
- Content collections for type-safe frontmatter
- Build times are fast

## URL structure

- `/` — landing page, about, latest essays
- `/essays/` — chronological, with tags
- `/essays/[slug]/` — individual post
- `/notes/` — shorter pieces, less polish
- `/now/` — what I'm working on currently (updated quarterly)
- `/reading/` — highlights from books and articles

## Design

- **Typography first** — Inter for body, Playfair for display, monospace for code
- **Long line length** (~72 characters) for comfortable reading
- **Dark mode** — respects system preference, toggle override
- **No images unless they add meaning** — don't stock-photo my way through

## Status

- Base site, routing, posts: done
- RSS feed: done
- Search: in progress (Pagefind)
- Newsletter integration: designed (Buttondown)
- Comments: intentionally not planned
