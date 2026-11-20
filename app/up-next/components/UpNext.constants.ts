import type { UpNextContent } from "@/lib/photo-spots";
import {
  IconBuildingSkyscraper,
  IconCamera,
  IconCloudRain,
  IconDrone,
  IconLeaf,
  IconMist,
  IconMoon,
  IconSnowflake,
  IconSunrise,
  IconSunset2,
  IconVideo,
  IconWorld,
  type Icon,
} from "@tabler/icons-react";

// The weather and times of day a spot suits, as small icon chips on its row.
const SPOT_TAG_ICONS: Record<string, Icon> = {
  sunrise: IconSunrise,
  sunset: IconSunset2,
  "blue hour": IconBuildingSkyscraper,
  night: IconMoon,
  fog: IconMist,
  rain: IconCloudRain,
  snow: IconSnowflake,
  autumn: IconLeaf,
  any: IconWorld,
};

// A row's chips: a Drone chip when it's shot by drone (camera is the norm), then its tags.
export function getSpotChips(spot: { gear: string; tags: string[] }) {
  const tags = spot.tags.map((tag) => ({
    label: tag.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    icon: SPOT_TAG_ICONS[tag] ?? null,
  }));
  return spot.gear === "drone" ? [{ label: "Drone", icon: IconDrone }, ...tags] : tags;
}

// Whether a spot's name or postcode contains the picker's search, ignoring case.
export function matchesSpotSearch(
  spot: { title: string; postcode: string | null },
  search: string,
) {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [spot.title, spot.postcode ?? ""].some((value) => value.toLowerCase().includes(query));
}

// The choices for what an Up next spot is being shot for, in menu order. A carousel is shown as
// a camera and a reel as a video camera.
export const UP_NEXT_CONTENT_OPTIONS = [
  { value: "reel", label: "Reel", icons: [IconVideo] },
  { value: "carousel", label: "Carousel", icons: [IconCamera] },
  { value: "both", label: "Both", icons: [IconCamera, IconVideo] },
] as const satisfies readonly { value: UpNextContent; label: string; icons: readonly Icon[] }[];

export function getUpNextContentOption(content: UpNextContent) {
  return (
    UP_NEXT_CONTENT_OPTIONS.find((option) => option.value === content) ?? UP_NEXT_CONTENT_OPTIONS[2]
  );
}

// The page's tabs. A spot shot for both shows under Carousel and Reel.
export const UP_NEXT_TABS = [
  { value: "all", label: "All" },
  { value: "carousel", label: "Carousel" },
  { value: "reel", label: "Reel" },
] as const;

export type UpNextTab = (typeof UP_NEXT_TABS)[number]["value"];

export function isInUpNextTab(content: UpNextContent, tab: UpNextTab) {
  return tab === "all" || content === tab || content === "both";
}
