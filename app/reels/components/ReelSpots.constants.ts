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

// The Reels page's tabs: every spot, or the spots with one reel type.
export type ReelSpotsTabId = "all" | (typeof REEL_TYPE_KINDS)[number];

export const REEL_SPOTS_TAB_STORAGE_KEY = "reel-spots-tab";

export function isReelSpotsTabId(value: unknown): value is ReelSpotsTabId {
  return value === "all" || REEL_TYPE_KINDS.some((kind) => kind === value);
}

// The tab last open on the Reels page in this browser tab, or All.
export function readStoredTab(): ReelSpotsTabId {
  try {
    const stored =
      typeof window === "undefined" ? null : sessionStorage.getItem(REEL_SPOTS_TAB_STORAGE_KEY);
    return isReelSpotsTabId(stored) ? stored : "all";
  } catch {
    // Storage can be blocked; the page just opens on All.
    return "all";
  }
}

// Puts the spots reordered within one tab back into the full order: they keep the places their
// tab's spots had, so the spots in other tabs don't move.
export function mergeTabOrder(allIds: string[], tabIds: string[]) {
  const inTab = new Set(tabIds);
  const reordered = [...tabIds];
  return allIds.map((id) => (inTab.has(id) ? reordered.shift()! : id));
}
