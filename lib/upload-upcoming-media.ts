import {
  SPOT_PHOTO_UPLOAD_URL,
  UPCOMING_MEDIA_PATH_PREFIX,
  UPCOMING_VIDEO_MAX_BYTES,
  UPCOMING_VIDEO_TYPES,
} from "@/lib/photo-spots";
import { resizeImage } from "@/lib/resize-image";
import { upload } from "@vercel/blob/client";

export type UploadedMedia = {
  url: string;
  mediaType: "image" | "video";
  // Videos only: a still frame shown until the video is played.
  posterUrl: string | null;
  // Photos only: a small copy for thumbnails, so lists don't download the full photo.
  thumbnailUrl: string | null;
  // Videos only, read from the file itself.
  durationSeconds: number | null;
};

const POSTER_WIDTH = 720;
const POSTER_QUALITY = 0.75;
// Thumbnails are at most 100×125 on screen, so 480px stays sharp at 3x even when a landscape
// photo is cropped to fill one.
const THUMBNAIL_EDGE = 480;
const THUMBNAIL_QUALITY = 0.75;

function toSlug(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "post";
}

// Stops raw or oversized videos before any bytes reach the Blob store.
function checkVideo(file: File) {
  const hint = "Run scripts/compress-videos.sh on it first.";
  if (!(UPCOMING_VIDEO_TYPES as readonly string[]).includes(file.type)) {
    throw new Error(`"${file.name}" isn't an MP4. ${hint}`);
  }
  if (file.size > UPCOMING_VIDEO_MAX_BYTES) {
    const limitMb = UPCOMING_VIDEO_MAX_BYTES / 1024 / 1024;
    throw new Error(`"${file.name}" is over ${limitMb} MB. ${hint}`);
  }
}

// A video's length in whole seconds (1–600) and a JPEG of the frame about 1s in, either of which
// is null if the browser can't read the file.
function readVideoDetails(
  file: File,
): Promise<{ durationSeconds: number | null; poster: Blob | null }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    let durationSeconds: number | null = null;
    const done = (poster: Blob | null) => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      resolve({ durationSeconds, poster });
    };
    // Some browsers never fire `seeked` for odd files; upload without a poster rather than hang.
    const timeout = setTimeout(() => done(null), 10_000);

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration)) {
        durationSeconds = Math.min(Math.max(Math.round(video.duration), 1), 600);
      }
      video.currentTime = Math.min(1, (video.duration || 0) / 2);
    };
    video.onseeked = () => {
      const scale = Math.min(1, POSTER_WIDTH / video.videoWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext("2d");
      if (!context || canvas.width === 0) return done(null);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(done, "image/jpeg", POSTER_QUALITY);
    };
    video.onerror = () => done(null);
    video.src = url;
  });
}

// Uploads a photo (resized first) or a video and its poster straight to Vercel Blob for an
// Upcoming Post.
export async function uploadUpcomingMedia(file: File, postTitle: string): Promise<UploadedMedia> {
  const isVideo = file.type.startsWith("video/");
  const slug = toSlug(postTitle);

  if (isVideo) {
    checkVideo(file);
    const [{ durationSeconds, poster }, blob] = await Promise.all([
      readVideoDetails(file),
      upload(`${UPCOMING_MEDIA_PATH_PREFIX}${slug}.mp4`, file, {
        access: "public",
        handleUploadUrl: SPOT_PHOTO_UPLOAD_URL,
        contentType: file.type,
      }),
    ]);
    const posterBlob = poster
      ? await upload(`${UPCOMING_MEDIA_PATH_PREFIX}${slug}-poster.jpg`, poster, {
          access: "public",
          handleUploadUrl: SPOT_PHOTO_UPLOAD_URL,
          contentType: "image/jpeg",
        })
      : null;
    return {
      url: blob.url,
      mediaType: "video",
      posterUrl: posterBlob?.url ?? null,
      thumbnailUrl: null,
      durationSeconds,
    };
  }

  const [image, thumbnail] = await Promise.all([
    resizeImage(file),
    resizeImage(file, THUMBNAIL_EDGE, THUMBNAIL_QUALITY),
  ]);
  const extension = image.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "jpg");
  const [blob, thumbnailBlob] = await Promise.all([
    upload(`${UPCOMING_MEDIA_PATH_PREFIX}${slug}.${extension}`, image, {
      access: "public",
      handleUploadUrl: SPOT_PHOTO_UPLOAD_URL,
      contentType: image.type || file.type,
    }),
    // resizeImage hands back the original if the browser can't decode it; that's no thumbnail.
    thumbnail === file
      ? null
      : upload(`${UPCOMING_MEDIA_PATH_PREFIX}${slug}-thumb.jpg`, thumbnail, {
          access: "public",
          handleUploadUrl: SPOT_PHOTO_UPLOAD_URL,
          contentType: "image/jpeg",
        }),
  ]);
  return {
    url: blob.url,
    mediaType: "image",
    posterUrl: null,
    thumbnailUrl: thumbnailBlob?.url ?? null,
    durationSeconds: null,
  };
}
