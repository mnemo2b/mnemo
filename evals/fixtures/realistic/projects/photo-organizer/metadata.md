# Photo Organizer — Metadata

## EXIF / IPTC / XMP

Photo files carry metadata in three specs:
- **EXIF** — camera-generated (capture time, aperture, shutter, ISO, GPS)
- **IPTC** — older, organization-focused (title, caption, keywords, creator)
- **XMP** — modern, extensible, Adobe-championed. Sidecar files (.xmp) or embedded.

Lightroom writes to XMP sidecars. Photos.app writes to its own database.

## What I read

From EXIF:
- `DateTimeOriginal` (not `DateTime`, which is mod time)
- `Make`, `Model`, `LensModel`
- `ExposureTime`, `FNumber`, `ISO`, `FocalLength`
- `GPSLatitude`, `GPSLongitude`

From XMP (when present):
- `dc:subject` (keywords)
- `dc:title`
- `lr:hierarchicalSubject` (hierarchical tags)
- `xmp:Rating` (1-5)

From filename + path when metadata is sparse:
- Dates from folder structure (`2018/03/`)
- Subject hints from filenames (`beach-trip-2019.jpg`)

## What I write

I don't. Read-only. The original files stay untouched. My own tags, faces, and searches live in the app database, referenced by file hash.

Why:
- Non-destructive — no corrupt file risk
- Compatible — Lightroom doesn't see my tags, but my tags survive Lightroom's workflows
- Portable — hash-keyed references survive rename/move

## Sidecar strategy

My app produces sidecar files when needed for interchange:
- `.photodb.json` alongside photos with my tags
- `.photodb.faces.json` with face locations + IDs
- Re-importable from scratch if the main DB is lost

## Timezone mess

- EXIF times are rarely timezone-aware
- I infer timezone from GPS when present
- Fall back to local time of import
- User can correct per-album if travel mode was off

## What I've learned

- Parse libraries lie; test with your actual files
- Camera makes write EXIF inconsistently (Sony and Fuji disagree about nothing)
- GPS accuracy varies wildly — some cameras round, some don't
