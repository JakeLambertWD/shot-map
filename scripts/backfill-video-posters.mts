// Gives Upcoming Post videos uploaded before posters existed (migration 016) a poster frame from
// near the start of the clip, so their thumbnails stop showing blank.
//
// Usage:
//   node --env-file=.env.local scripts/backfill-video-posters.mts --dry-run [folder]
//     Saves each frame to the folder (default ./poster-backfill) to check; changes nothing.
//   node --env-file=.env.local scripts/backfill-video-posters.mts [folder]
//     Uploads each frame to Vercel Blob and saves it as the video's poster_url. Frames already
//     saved in the folder by a dry run are uploaded as they are, without reading the video again.
//
// ffmpeg reads each video straight from its Blob URL with range requests, so it only fetches the
// index and the opening frames, not the whole file. Each line reports the bytes it read.
//
// Needs ffmpeg: brew install ffmpeg

import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BLOB_CACHE_MAX_AGE_SECONDS, UPCOMING_MEDIA_PATH_PREFIX } from "../lib/photo-spots.ts";

// Half a second in skips a black or blurry first frame; very short clips use the first frame.
const FRAME_AT_SECONDS = 0.5;
const POSTER_WIDTH = 720;

type Frame = { jpeg: Buffer; bytesRead: number };

// One JPEG frame of the video, plus how many bytes ffmpeg fetched to get it.
function grabFrame(videoUrl: string, atSeconds: number): Promise<Frame> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-hide_banner",
      // Verbose logging includes the "Statistics: N bytes read" line for the HTTP input.
      "-loglevel",
      "verbose",
      "-ss",
      String(atSeconds),
      "-i",
      videoUrl,
      "-frames:v",
      "1",
      "-vf",
      `scale='min(${POSTER_WIDTH},iw)':-2`,
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
        reject(new Error(`ffmpeg exited ${code}: ${log.trim().split("\n").slice(-3).join(" ")}`));
        return;
      }
      const bytesRead = [...log.matchAll(/Statistics: (\d+) bytes read/g)].reduce(
        (total, match) => total + Number(match[1]),
        0,
      );
      resolve({ jpeg, bytesRead });
    });
  });
}

async function grabPoster(videoUrl: string, savedFile: string): Promise<Frame> {
  const saved = await readFile(savedFile).catch(() => null);
  if (saved) return { jpeg: saved, bytesRead: 0 };
  try {
    return await grabFrame(videoUrl, FRAME_AT_SECONDS);
  } catch {
    return grabFrame(videoUrl, 0);
  }
}

// "upcoming/bow-road-trial-reels-yUly….mov" → "upcoming/bow-road-trial-reels-yUly…-poster.jpg"
function posterPathFor(videoUrl: string) {
  const name = path.basename(new URL(videoUrl).pathname).replace(/\.[^.]+$/, "");
  return `${UPCOMING_MEDIA_PATH_PREFIX}${name}-poster.jpg`;
}

const formatKb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const outDir = args.find((arg) => !arg.startsWith("--")) ?? "poster-backfill";
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL isn't set.");
  if (!dryRun && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN isn't set.");
  }

  const sql = neon(process.env.DATABASE_URL);
  const videos = (await sql`
    select id, media_url from upcoming_post_media
    where media_type = 'video' and poster_url is null
    order by created_at
  `) as { id: string; media_url: string }[];

  if (videos.length === 0) {
    console.log("Every video already has a poster.");
    return;
  }
  console.log(`${videos.length} videos without a poster${dryRun ? " (dry run)" : ""}`);
  if (dryRun) await mkdir(outDir, { recursive: true });

  let totalRead = 0;
  let failed = 0;
  for (const video of videos) {
    const posterPath = posterPathFor(video.media_url);
    const file = path.join(outDir, path.basename(posterPath));
    try {
      const { jpeg, bytesRead } = await grabPoster(video.media_url, dryRun ? "" : file);
      totalRead += bytesRead;
      const sizes = `read ${formatKb(bytesRead)}, poster ${formatKb(jpeg.length)}`;

      if (dryRun) {
        await writeFile(file, jpeg);
        console.log(`✓ ${file} (${sizes})`);
        continue;
      }

      const blob = await put(posterPath, jpeg, {
        access: "public",
        addRandomSuffix: true,
        cacheControlMaxAge: BLOB_CACHE_MAX_AGE_SECONDS,
        contentType: "image/jpeg",
      });
      // Only fill a gap, in case a poster was added since this started.
      await sql`
        update upcoming_post_media set poster_url = ${blob.url}
        where id = ${video.id} and poster_url is null
      `;
      console.log(`✓ ${posterPath} (${sizes})`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${video.media_url}: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`Done. Read ${formatKb(totalRead)} from Blob in total; ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

await main();
