import type { UpcomingPost, UpcomingPostKind } from "@/server/routers/upcomingPosts";

export const UPCOMING_KIND_OPTIONS: { value: UpcomingPostKind; label: string }[] = [
  { value: "carousel", label: "Carousel" },
  { value: "reel", label: "Reel" },
];

// "Carousel · 3 photos · Canary Wharf" for photo posts.
export function formatPhotoPostSummary(post: UpcomingPost) {
  const kind = post.kind === "single" ? "Single photo" : "Carousel";
  const videos = post.media.filter((media) => media.mediaType === "video").length;
  const photos = post.media.length - videos;
  const counts = [
    photos > 0 && `${photos} ${photos === 1 ? "photo" : "photos"}`,
    videos > 0 && `${videos} ${videos === 1 ? "video" : "videos"}`,
  ].filter(Boolean);
  const parts = [kind, ...(post.kind === "single" ? [] : counts), post.spotTitle].filter(Boolean);
  return parts.join(" · ");
}

// "2 clips · ~23s · Bank" for reels.
export function formatReelPostSummary(post: UpcomingPost) {
  const clips = post.media.length;
  const seconds = post.media.reduce((total, clip) => total + (clip.durationSeconds ?? 0), 0);
  const parts = [
    clips === 0 ? "No clips yet" : `${clips} ${clips === 1 ? "clip" : "clips"}`,
    seconds > 0 && `~${seconds}s`,
    post.spotTitle,
  ].filter(Boolean);
  return parts.join(" · ");
}
