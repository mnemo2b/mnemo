# Recipe App

Personal recipe manager. Started this because every existing app has the wrong model — recipes as social content rather than personal craft knowledge.

## What it does

- Import recipes from URLs, free text, or photos
- Structured fields (ingredients with quantities, steps, timing, equipment)
- Notes per recipe (what I changed, what went wrong)
- Versions over time (the 7th attempt at carbonara is different from the 1st)
- Meal planning + shopping list generation

## Stack

- SvelteKit frontend
- Rust + SQLite backend (local-first, sync later)
- LLM for URL ingestion and photo OCR
- No cloud by default

## Status

- Core recipe CRUD: done
- URL import with Claude 3.5: done
- Shopping list: in progress
- Meal planning: designed, not built
- Sync: out of scope for v1

## Why it matters to me

- I have real recipes scattered across Notion, Apple Notes, iCloud photos, and cookbooks
- Existing apps assume I want to share — I want to own my knowledge
- Cooking knowledge compounds; apps should support that growth, not fight it
