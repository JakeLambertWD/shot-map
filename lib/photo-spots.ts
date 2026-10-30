// Shared by the map UI, the spots tRPC router and the photo upload route.

// Editing is open to anyone who can reach the API until the site has sign-in.
export const CAN_EDIT_SPOTS = true;

export const SPOT_PHOTO_UPLOAD_URL = "/api/spot-photos/upload";
export const SPOT_PHOTO_PATH_PREFIX = "spots/";
export const SPOT_PHOTO_MAX_BYTES = 20 * 1024 * 1024;
export const SPOT_PHOTO_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

// Upcoming Posts keep their photos and videos under their own prefix in the same Blob store.
export const UPCOMING_MEDIA_PATH_PREFIX = "upcoming/";
export const UPCOMING_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
export const UPCOMING_VIDEO_MAX_BYTES = 500 * 1024 * 1024;
export const MAX_UPCOMING_MEDIA = 20;

export const MAX_SPOT_PHOTOS = 10;
export const MAX_SPOT_TAGS = 8;

export const PHOTO_KINDS = ["showcase", "creator", "editing"] as const;
export type PhotoKind = (typeof PHOTO_KINDS)[number];

export const SPOT_STATUSES = ["planning", "ready_to_shoot"] as const;
export type SpotStatus = (typeof SPOT_STATUSES)[number];
export const DEFAULT_SPOT_STATUS: SpotStatus = "planning";

export const SPOT_STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "ready_to_shoot", label: "Ready to shoot" },
] as const satisfies readonly { value: SpotStatus; label: string }[];

export function getSpotStatusLabel(status: SpotStatus) {
  return SPOT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

// What the spot will be shot with.
export const SPOT_GEAR = ["camera", "drone"] as const;
export type SpotGear = (typeof SPOT_GEAR)[number];
export const DEFAULT_SPOT_GEAR: SpotGear = "camera";

export const SPOT_GEAR_OPTIONS = [
  { value: "camera", label: "Camera", emoji: "📷" },
  { value: "drone", label: "Drone", emoji: "🚁" },
] as const satisfies readonly { value: SpotGear; label: string; emoji: string }[];

export function getSpotGearOption(gear: SpotGear) {
  return SPOT_GEAR_OPTIONS.find((option) => option.value === gear) ?? SPOT_GEAR_OPTIONS[0];
}

// Only accept photos that were uploaded to this project's public Vercel Blob store.
export function isSpotPhotoUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith(`/${SPOT_PHOTO_PATH_PREFIX}`)
    );
  } catch {
    return false;
  }
}

// Only accept Upcoming Post media that was uploaded to this project's public Vercel Blob store.
export function isUpcomingMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith(`/${UPCOMING_MEDIA_PATH_PREFIX}`)
    );
  } catch {
    return false;
  }
}

// Saved ids for the reel tabs. "technique" shows as "1 Clip" and "pov" as "Trial Reels".
export const REEL_KINDS = ["bts", "educational", "technique", "pov"] as const;
export type ReelKind = (typeof REEL_KINDS)[number];

// Reel inspo links must point at Instagram (a reel, post, etc.).
export function isInstagramUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return (
      url.protocol === "https:" &&
      (url.hostname === "instagram.com" || url.hostname.endsWith(".instagram.com")) &&
      url.pathname.length > 1
    );
  } catch {
    return false;
  }
}

// Drops tracking parameters like ?igsh=… so saved links stay tidy.
export function cleanInstagramUrl(value: string) {
  const url = new URL(value.trim());
  return `https://www.instagram.com${url.pathname}`;
}

// Capitalises every word of a spot name as it is typed, e.g. "view from the shard" → "View From The Shard".
// Only the first letter of each word changes, so "LSEG" or "McDonald's" stay as typed,
// and the length never changes, which keeps the cursor in place.
export function formatSpotTitle(value: string) {
  return value.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

// Formats the spot name input in place and keeps the cursor where it was.
export function applySpotTitleCase(input: HTMLInputElement) {
  const formatted = formatSpotTitle(input.value);
  if (formatted !== input.value) {
    const { selectionStart, selectionEnd } = input;
    input.value = formatted;
    input.setSelectionRange(selectionStart, selectionEnd);
  }
  return formatted;
}

// A day as YYYY-MM-DD in the viewer's own time zone, for Today's shoot.
export function toShootDate(date: Date) {
  return date.toLocaleDateString("en-CA");
}

export function getTodayShootDate() {
  return toShootDate(new Date());
}

export function getYesterdayShootDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toShootDate(date);
}

export const SHOOT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
