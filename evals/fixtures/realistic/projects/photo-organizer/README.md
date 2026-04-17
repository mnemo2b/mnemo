# Photo Organizer

Local-first photo library for ~40k photos spanning 15 years. Lightroom replacement for the organizing side, keeping Lightroom for editing.

## The problem

- iCloud is opaque and slow
- Apple Photos organizes poorly for pros
- Lightroom's library is good for editing, bad for browsing
- No tool indexes the photos I actually want to find (moments, not keywords)

## What I'm building

- Fast local index: filename, metadata, auto-generated tags
- Smart search ("beach sunsets 2019", "photos of my dog", "black and white portraits")
- Face recognition (local, never uploaded)
- Scene / object detection (using a local vision model)
- Manual tags where auto-tags fall short
- Bridge to Lightroom — can launch the editing side from an album

## Stack

- Rust backend (binary, no server)
- SQLite + FTS5 for search
- CLIP for embeddings → nearest-neighbor search for visual similarity
- FaceNet locally for face clustering
- Svelte UI, native web view

## Not building

- Cloud sync (I have an NAS + offsite backup already)
- Editing tools (Lightroom is excellent)
- Social sharing
- AI "enhancement" (I want accurate, not manipulated)

## Status

- File scanner + SQLite schema: done
- EXIF indexing: done
- CLIP embeddings: in progress
- Face clustering: designed
- UI: mockup stage

## Why it matters

I want to find "that photo from 2017 with the dog at the beach" in under 5 seconds. Current options fail this basic test.
