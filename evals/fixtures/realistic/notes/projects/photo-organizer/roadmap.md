# Photo Organizer — Roadmap

## v0.1 (done)

- File scanner, recursive
- SQLite schema (photos, albums, tags, faces)
- EXIF read, full-text index
- CLI `photodb search` with metadata filters

## v0.2 (in progress)

- CLIP embeddings for visual similarity
- "More like this" search
- Semantic text search ("dog at beach")
- UI: browse, filter, search

## v0.3

- Face clustering (FaceNet local)
- Person pages — all photos of X
- Manual merge / split clusters

## v0.4

- Smart albums via rules ("all photos rated 4+ from 2023 on my X100V")
- Bulk tagging
- Export curated sets (date range, tag, rating)

## v0.5

- Duplicate detection (hash + perceptual hash)
- Similar photo grouping
- Suggested deletions (blurry, near-duplicates)

## v1.0

- Stable release, import from Lightroom + Apple Photos
- Migration docs
- Backup + restore flow
- Companion web viewer (read-only, for sharing)

## Post-v1

- Mobile viewer (React Native)
- Collaborative albums (shared, local-first sync)
- Plugin system for custom tagging (cooking photos, plant ID)

## What I've learned building this

- Do the scanner + DB first — get the data in, defer UI
- Local models work surprisingly well for this class of problem
- EXIF edge cases will eat you; write fuzz tests
- Performance matters from day one for 40k+ photos
- Don't promise sync until the single-device experience is 90% there
