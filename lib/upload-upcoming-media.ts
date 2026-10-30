import { SPOT_PHOTO_UPLOAD_URL, UPCOMING_MEDIA_PATH_PREFIX } from "@/lib/photo-spots";
import { resizeImage } from "@/lib/resize-image";
import { upload } from "@vercel/blob/client";

export type UploadedMedia = {
  url: string;
  mediaType: "image" | "video";
  // Videos only, read from the file itself.
  durationSeconds: number | null;
};

function toSlug(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "post";
}

// A video's length in whole seconds (1–600), or null if the browser can't read it.
function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = (seconds: number | null) => {
      URL.revokeObjectURL(url);
      resolve(seconds);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      done(
        Number.isFinite(video.duration)
          ? Math.min(Math.max(Math.round(video.duration), 1), 600)
          : null,
      );
    video.onerror = () => done(null);
    video.src = url;
  });
}

// Uploads a photo (resized first) or a video straight to Vercel Blob for an Upcoming Post.
export async function uploadUpcomingMedia(file: File, postTitle: string): Promise<UploadedMedia> {
  const isVideo = file.type.startsWith("video/");
  const slug = toSlug(postTitle);

  if (isVideo) {
    const [durationSeconds, blob] = await Promise.all([
      readVideoDuration(file),
      upload(`${UPCOMING_MEDIA_PATH_PREFIX}${slug}.${file.name.split(".").pop() ?? "mp4"}`, file, {
        access: "public",
        handleUploadUrl: SPOT_PHOTO_UPLOAD_URL,
        contentType: file.type,
        // Splits big videos into parts so they upload reliably.
        multipart: file.size > 50 * 1024 * 1024,
      }),
    ]);
    return { url: blob.url, mediaType: "video", durationSeconds };
  }

  const image = await resizeImage(file);
  const extension = image.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "jpg");
  const blob = await upload(`${UPCOMING_MEDIA_PATH_PREFIX}${slug}.${extension}`, image, {
    access: "public",
    handleUploadUrl: SPOT_PHOTO_UPLOAD_URL,
    contentType: image.type || file.type,
  });
  return { url: blob.url, mediaType: "image", durationSeconds: null };
}
