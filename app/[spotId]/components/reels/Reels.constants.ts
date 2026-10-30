import type { ReelKind } from "@/lib/photo-spots";
import type { SpotReelClip } from "@/server/routers/reels";

export const REEL_CARD_BORDER = "1px solid var(--mantine-color-brown-4)";
export const CLIP_DIVIDER = "1px solid var(--mantine-color-brown-4)";

// "7 clips · ~21s", or "No clips yet".
export function formatReelSummary(clips: SpotReelClip[]) {
  if (clips.length === 0) return "No clips yet";

  const clipCount = `${clips.length} ${clips.length === 1 ? "clip" : "clips"}`;
  const seconds = clips.reduce((total, clip) => total + (clip.durationSeconds ?? 0), 0);

  return seconds > 0 ? `${clipCount} · ~${seconds}s` : clipCount;
}

// Per-tab wording for the reel ideas list.
export const REEL_KIND_COPY: Record<ReelKind, { emptyText: string; placeholder: string }> = {
  bts: {
    emptyText: "No BTS reel ideas yet",
    placeholder: "e.g. I waited 20 minutes for this one moment",
  },
  educational: {
    emptyText: "No educational reel ideas yet",
    placeholder: "e.g. 3 tips for shooting this spot at night",
  },
  technique: {
    emptyText: "No 1 clip reel ideas yet",
    placeholder: "e.g. 1 Clip #01: the puddle reflection",
  },
  pov: {
    emptyText: "No trial reel ideas yet",
    placeholder: "e.g. POV: you wait 20 mins for one train",
  },
};

// The reel types that share the Reels tab, in the order the type menu lists them. New reels
// there start as the first one.
export const REEL_TYPE_KINDS = [
  "educational",
  "technique",
  "bts",
] as const satisfies readonly ReelKind[];

// Label and colours for each reel type's pill. Colours differ in lightness as well as hue.
export const REEL_TYPE_STYLES: Record<
  (typeof REEL_TYPE_KINDS)[number],
  { label: string; color: string; text: string; tint: string }
> = {
  educational: {
    label: "Educational",
    color: "#74a9e8",
    text: "#9cc4f0",
    tint: "rgba(116, 169, 232, 0.12)",
  },
  technique: {
    label: "1 Clip",
    color: "#e7ba3d",
    text: "#f4d05f",
    tint: "rgba(231, 186, 61, 0.14)",
  },
  bts: { label: "BTS", color: "#e8916a", text: "#f0ad8e", tint: "rgba(232, 145, 106, 0.12)" },
};

// Wording for the combined Reels tab.
export const REELS_TAB_COPY = {
  emptyText: "No reel ideas yet",
  placeholder: "e.g. 3 tips for shooting this spot at night",
};
