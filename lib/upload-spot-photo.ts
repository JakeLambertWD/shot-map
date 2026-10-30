import { SPOT_PHOTO_PATH_PREFIX, SPOT_PHOTO_UPLOAD_URL } from "@/lib/photo-spots";
import { resizeImage } from "@/lib/resize-image";
import { upload } from "@vercel/blob/client";

function toSlug(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return slug || "photo";
}

// Resizes a photo in the browser, uploads it straight to Vercel Blob and returns its public URL.
export async function uploadSpotPhoto(file: File, spotTitle: string) {
  const image = await resizeImage(file);
  const extension = image.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "jpg");

  const blob = await upload(`${SPOT_PHOTO_PATH_PREFIX}${toSlug(spotTitle)}.${extension}`, image, {
    access: "public",
    handleUploadUrl: SPOT_PHOTO_UPLOAD_URL,
    contentType: image.type || file.type,
  });

  return blob.url;
}

export function getPhotoUploadErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Something went wrong.";

  // The Blob client hides the upload route's reason, which is almost always a missing token.
  if (error.message.includes("client token")) {
    return "Couldn't start the photo upload. Check BLOB_READ_WRITE_TOKEN is in .env.local and restart the dev server.";
  }

  return error.message;
}
