// Gives Upcoming Post photos uploaded before thumbnails existed (migration 017) a small copy, so
// the cards and sheet stop downloading the full-size photo.
//
// Usage:
//   node --env-file=.env.local scripts/backfill-upcoming-thumbnails.mts --dry-run [folder]
//     Saves each thumbnail to the folder (default ./thumbnail-backfill) to check; changes nothing.
//   node --env-file=.env.local scripts/backfill-upcoming-thumbnails.mts [folder]
//     Uploads each thumbnail to Vercel Blob and saves it as the photo's thumbnail_url. Thumbnails
//     already saved in the folder by a dry run are uploaded as they are, without reading the
//     photo again.
//
// Needs ffmpeg: brew install ffmpeg

import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BLOB_CACHE_MAX_AGE_SECONDS, UPCOMING_MEDIA_PATH_PREFIX } from "../lib/photo-spots.ts";

// Matches THUMBNAIL_EDGE in lib/upload-upcoming-media.ts.
const THUMBNAIL_EDGE = 480;

// The photo shrunk to fit THUMBNAIL_EDGE, as a JPEG.
function makeThumbnail(photoUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      photoUrl,
      "-frames:v",
      "1",
      "-vf",
      `scale='min(${THUMBNAIL_EDGE},iw)':'min(${THUMBNAIL_EDGE},ih)':force_original_aspect_ratio=decrease`,
      "-q:v",
      "5",
      "-f",
      "image2pipe",
      "-vcodec",
      "mjpeg",
      "pipe:1",
    ]);
    const chunks: Buffer[] = [];
    let log = "";
    ffmpeg.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (chunk: Buffer) => (log += chunk.toString()));
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      const jpeg = Buffer.concat(chunks);
      if (code !== 0 || jpeg.length === 0) {
        reject(new Error(`ffmpeg exited ${code}: ${log.trim()}`));
      } else {
        resolve(jpeg);
      }
    });
  });
}

// "upcoming/canary-wharf-AbC….jpg" → "upcoming/canary-wharf-AbC…-thumb.jpg"
function thumbnailPathFor(photoUrl: string) {
  const name = path.basename(new URL(photoUrl).pathname).replace(/\.[^.]+$/, "");
  return `${UPCOMING_MEDIA_PATH_PREFIX}${name}-thumb.jpg`;
}

const formatKb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const outDir = args.find((arg) => !arg.startsWith("--")) ?? "thumbnail-backfill";
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL isn't set.");
  if (!dryRun && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN isn't set.");
  }

  const sql = neon(process.env.DATABASE_URL);
  const photos = (await sql`
    select id, media_url from upcoming_post_media
    where media_type = 'image' and thumbnail_url is null
    order by created_at
  `) as { id: string; media_url: string }[];

  if (photos.length === 0) {
    console.log("Every photo already has a thumbnail.");
    return;
  }
  console.log(`${photos.length} photos without a thumbnail${dryRun ? " (dry run)" : ""}`);
  if (dryRun) await mkdir(outDir, { recursive: true });

  let failed = 0;
  for (const photo of photos) {
    const thumbnailPath = thumbnailPathFor(photo.media_url);
    const file = path.join(outDir, path.basename(thumbnailPath));
    try {
      const saved = dryRun ? null : await readFile(file).catch(() => null);
      const jpeg = saved ?? (await makeThumbnail(photo.media_url));

      if (dryRun) {
        await writeFile(file, jpeg);
        console.log(`✓ ${file} (${formatKb(jpeg.length)})`);
        continue;
      }

      const blob = await put(thumbnailPath, jpeg, {
        access: "public",
        addRandomSuffix: true,
        cacheControlMaxAge: BLOB_CACHE_MAX_AGE_SECONDS,
        contentType: "image/jpeg",
      });
      // Only fill a gap, in case a thumbnail was added since this started.
      await sql`
        update upcoming_post_media set thumbnail_url = ${blob.url}
        where id = ${photo.id} and thumbnail_url is null
      `;
      console.log(`✓ ${thumbnailPath} (${formatKb(jpeg.length)}${saved ? ", from dry run" : ""})`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${photo.media_url}: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`Done. ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

await main();
