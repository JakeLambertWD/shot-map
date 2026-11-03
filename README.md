# ShotMap

My photo spots around London on a map: planning shoots, reel ideas, creator shots and trial reels.

Split out of the photography portfolio, where it lived at `/maps`. It shares the portfolio's Neon
database and Vercel Blob store, so all spots, photos and reels carry over as they are.

## Setup

```bash
pnpm install
pnpm dev
```

`.env.local` needs:

- `DATABASE_URL`: the Neon database (the same one the portfolio uses)
- `BLOB_STORE_ID` and `BLOB_READ_WRITE_TOKEN`: the Vercel Blob store for spot photos

## Database

The spot tables already exist in Neon. New migrations go in `db/migrations` here. Each one is
safe to run more than once. Run them in the Neon SQL editor, then `pnpm db:types` to refresh
`server/db.types.ts`.

## Upcoming Post videos

Videos must be MP4s under 8 MB, so the Blob store's monthly data transfer lasts. Compress them
first (needs `brew install ffmpeg`):

```bash
scripts/compress-videos.sh ~/Desktop/reel-clips
```

This writes 720p MP4s, plus a poster frame for each, to `~/Desktop/reel-clips/compressed`.

See `docs/photo-spots-map.md` for how the map, spot pages and API fit together.
