import type { UpcomingPost, UpcomingPostKind } from "@/server/routers/upcomingPosts";

export const UPCOMING_KIND_OPTIONS: { value: UpcomingPostKind; label: string }[] = [
  { value: "carousel", label: "Carousel" },
  { value: "single", label: "Single photo" },
  { value: "reel", label: "Reel" },
];

// Today as "YYYY-MM-DD" in the phone's own time zone.
export function getLocalDateString(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  return getLocalDateString(new Date(year, month - 1, day + days));
}

const HEADING_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export type DateGroup = {
  key: string;
  // e.g. "SAT 1 NOV · TOMORROW" or "NO DATE YET".
  heading: string;
  tone: "soon" | "overdue" | "later" | "none";
  posts: UpcomingPost[];
};

// Groups posts (already sorted soonest first, undated last) under one heading per day.
export function groupPostsByDate(posts: UpcomingPost[], today = getLocalDateString()): DateGroup[] {
  const tomorrow = addDays(today, 1);
  const groups: DateGroup[] = [];

  for (const post of posts) {
    const key = post.postDate ?? "none";
    let group = groups.at(-1);
    if (group?.key !== key) {
      group = { key, posts: [], ...describeDate(post.postDate, today, tomorrow) };
      groups.push(group);
    }
    group.posts.push(post);
  }
  return groups;
}

function describeDate(postDate: string | null, today: string, tomorrow: string) {
  if (!postDate) return { heading: "NO DATE YET", tone: "none" as const };

  const [year, month, day] = postDate.split("-").map(Number);
  const label = HEADING_FORMAT.format(new Date(year, month - 1, day))
    .replace(",", "")
    .toUpperCase();

  if (postDate < today) return { heading: `${label} · OVERDUE`, tone: "overdue" as const };
  if (postDate === today) return { heading: `${label} · TODAY`, tone: "soon" as const };
  if (postDate === tomorrow) return { heading: `${label} · TOMORROW`, tone: "soon" as const };
  return { heading: label, tone: "later" as const };
}

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
