import { REEL_TYPE_KINDS } from "@/app/[spotId]/components/reels/Reels.constants";
import type { ReelSpot } from "@/server/routers/reels";

export type ReelKindCount = { kind: (typeof REEL_TYPE_KINDS)[number]; count: number };

// "1 reel" or "3 reels".
export function formatReelCount(count: number) {
  return `${count} ${count === 1 ? "reel" : "reels"}`;
}

// A spot's postcode, or its coordinates when it has none.
export function formatSpotLocation(spot: {
  postcode: string | null;
  latitude: number;
  longitude: number;
}) {
  return spot.postcode ?? `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`;
}

// A spot's reel types in the reel type menu's order.
export function sortKindCounts(kinds: ReelSpot["kinds"]): ReelKindCount[] {
  return REEL_TYPE_KINDS.flatMap((kind) =>
    kinds.filter((row) => row.kind === kind).map(({ count }) => ({ kind, count })),
  );
}

export function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
