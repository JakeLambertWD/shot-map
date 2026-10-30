import {
  CAN_EDIT_SPOTS,
  SPOT_PHOTO_ALLOWED_TYPES,
  SPOT_PHOTO_MAX_BYTES,
  SPOT_PHOTO_PATH_PREFIX,
  UPCOMING_MEDIA_PATH_PREFIX,
  UPCOMING_VIDEO_MAX_BYTES,
  UPCOMING_VIDEO_TYPES,
} from "@/lib/photo-spots";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// Issues short-lived tokens so the browser can upload spot photos, and Upcoming Post photos and
// videos, straight to Vercel Blob.
export async function POST(request: Request) {
  if (!CAN_EDIT_SPOTS) {
    return Response.json(
      { error: "Uploading photos is disabled in production until sign-in is added." },
      { status: 403 },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "BLOB_READ_WRITE_TOKEN is not configured. Add a Vercel Blob store to the project." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (pathname.startsWith(UPCOMING_MEDIA_PATH_PREFIX)) {
          return {
            allowedContentTypes: [...SPOT_PHOTO_ALLOWED_TYPES, ...UPCOMING_VIDEO_TYPES],
            maximumSizeInBytes: UPCOMING_VIDEO_MAX_BYTES,
            addRandomSuffix: true,
          };
        }

        if (!pathname.startsWith(SPOT_PHOTO_PATH_PREFIX)) {
          throw new Error("Invalid upload path.");
        }

        return {
          allowedContentTypes: [...SPOT_PHOTO_ALLOWED_TYPES],
          maximumSizeInBytes: SPOT_PHOTO_MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
