import type { ReelKind } from "@/lib/photo-spots";
import type { SpotReelClip } from "@/server/routers/reels";

export const REEL_CARD_BORDER = "1px solid var(--mantine-color-teal-4)";
export const CLIP_DIVIDER = "1px solid var(--mantine-color-teal-4)";

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
  humour: {
    emptyText: "No humour reel ideas yet",
    placeholder: "e.g. Things photographers say at blue hour",
  },
  still_frames: {
    emptyText: "No still frames reel ideas yet",
    placeholder: "e.g. 8 still frames from one night at the station",
  },
  location_reveal: {
    emptyText: "No location reveal reel ideas yet",
    placeholder: "e.g. Guess where this is, then pull back to show the station",
  },
  showcase: {
    emptyText: "No showcase reel ideas yet",
    placeholder: "e.g. The best 6 shots from this spot, cut to the beat",
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
  "bts",
  "humour",
  "location_reveal",
  "showcase",
  "still_frames",
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
  bts: { label: "BTS", color: "#e8916a", text: "#f0ad8e", tint: "rgba(232, 145, 106, 0.12)" },
  humour: {
    label: "Humour",
    color: "#c48be0",
    text: "#d9b1ee",
    tint: "rgba(196, 139, 224, 0.12)",
  },
  still_frames: {
    label: "Still Frames",
    color: "#6cc59b",
    text: "#97d8b8",
    tint: "rgba(108, 197, 155, 0.12)",
  },
  location_reveal: {
    label: "Location Reveal",
    color: "#e07a9a",
    text: "#eea6bd",
    tint: "rgba(224, 122, 154, 0.12)",
  },
  showcase: {
    label: "Showcase",
    color: "#e7ba3d",
    text: "#f4d05f",
    tint: "rgba(231, 186, 61, 0.14)",
  },
};

// Wording for the combined Reels tab.
export const REELS_TAB_COPY = {
  emptyText: "No reel ideas yet",
  placeholder: "e.g. 3 tips for shooting this spot at night",
};
