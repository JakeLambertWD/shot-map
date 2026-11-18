import { REEL_TYPE_KINDS } from "@/app/[spotId]/components/reels/Reels.constants";
import type { ReelSpot } from "@/server/routers/reels";

export type ReelKindCount = { kind: (typeof REEL_TYPE_KINDS)[number]; count: number };

// "1 reel" or "3 reels".
export function formatReelCount(count: number) {
  return `${count} ${count === 1 ? "reel" : "reels"}`;
}

// A spot's reel types in the reel type menu's order.
export function sortKindCounts(kinds: ReelSpot["kinds"]): ReelKindCount[] {
  return REEL_TYPE_KINDS.flatMap((kind) =>
    kinds.filter((row) => row.kind === kind).map(({ count }) => ({ kind, count })),
  );
}
