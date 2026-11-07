import {
  SPOT_GEAR_OPTIONS,
  SPOT_STATUS_OPTIONS,
  type SpotGear,
  type SpotStatus,
} from "@/lib/photo-spots";
import type { SpotSummary } from "@/server/routers/spots";
import { SPOT_TAG_EMOJIS, SUGGESTED_SPOT_TAGS } from "../add-spot/AddSpot.constants";

export type SpotFilters = {
  // Weather tags; a spot matches if it has any of them (or is tagged "any").
  weather: string[];
  // null means any status.
  status: SpotStatus | null;
  // Empty means any gear.
  gear: SpotGear[];
  // Spots that have (true) or haven't (false) been posted; null shows both. Defaults to false, so
  // the map leads with spots still to post.
  posted: boolean | null;
};

// The filters the map starts with, and goes back to when they're cleared.
export const EMPTY_SPOT_FILTERS: SpotFilters = {
  weather: [],
  status: null,
  gear: [],
  posted: false,
};

// Keeps the filters while the user opens a spot and comes back to the map.
export const SPOT_FILTERS_STORAGE_KEY = "photo-spots:filters";

// Short status labels for the filter toggle.
export const STATUS_FILTER_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "planning", label: "Planning" },
  { value: "ready_to_shoot", label: "Ready" },
] as const;

// Labels for the Posted filter toggle, in its order.
export const POSTED_FILTER_OPTIONS = [
  { value: null, label: "Any" },
  { value: false, label: "Not posted" },
  { value: true, label: "Posted" },
] as const satisfies readonly { value: boolean | null; label: string }[];

const ANY_WEATHER_TAG = "any";

export function formatWeatherLabel(tag: string) {
  return tag.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getWeatherEmoji(tag: string) {
  return SPOT_TAG_EMOJIS[tag];
}

// The suggested weather options, then any custom ones spots use. "Any" isn't a filter.
export function getWeatherFilterOptions(spots: SpotSummary[]) {
  const options: string[] = SUGGESTED_SPOT_TAGS.filter((tag) => tag !== ANY_WEATHER_TAG);
  for (const spot of spots) {
    for (const tag of spot.tags) {
      if (tag !== ANY_WEATHER_TAG && !options.includes(tag)) options.push(tag);
    }
  }
  return options;
}

// The default "Not posted" doesn't count, so the map isn't always showing one filter on.
export function countActiveFilters(filters: SpotFilters) {
  return (
    filters.weather.length +
    (filters.status ? 1 : 0) +
    filters.gear.length +
    (filters.posted === EMPTY_SPOT_FILTERS.posted ? 0 : 1)
  );
}

export function matchesSpotFilters(spot: SpotSummary, filters: SpotFilters) {
  if (filters.posted !== null && spot.posted !== filters.posted) return false;
  if (filters.status && spot.status !== filters.status) return false;
  if (filters.gear.length > 0 && !filters.gear.includes(spot.gear)) return false;
  if (
    filters.weather.length > 0 &&
    !spot.tags.some((tag) => tag === ANY_WEATHER_TAG || filters.weather.includes(tag))
  ) {
    return false;
  }
  return true;
}

export type ActiveFilterChip = {
  key: string;
  label: string;
  remove: (f: SpotFilters) => SpotFilters;
};

// One removable chip per active filter, in the panel's order.
export function getActiveFilterChips(filters: SpotFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = filters.weather.map((tag) => ({
    key: `weather:${tag}`,
    label: formatWeatherLabel(tag),
    remove: (f) => ({ ...f, weather: f.weather.filter((value) => value !== tag) }),
  }));

  if (filters.status) {
    const status = filters.status;
    chips.push({
      key: `status:${status}`,
      label:
        STATUS_FILTER_OPTIONS.find((option) => option.value === status)?.label ??
        SPOT_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
        status,
      remove: (f) => ({ ...f, status: null }),
    });
  }

  for (const gear of filters.gear) {
    chips.push({
      key: `gear:${gear}`,
      label: SPOT_GEAR_OPTIONS.find((option) => option.value === gear)?.label ?? gear,
      remove: (f) => ({ ...f, gear: f.gear.filter((value) => value !== gear) }),
    });
  }

  if (filters.posted !== EMPTY_SPOT_FILTERS.posted) {
    chips.push({
      key: `posted:${filters.posted}`,
      label: filters.posted ? "Posted" : "Posted or not",
      remove: (f) => ({ ...f, posted: EMPTY_SPOT_FILTERS.posted }),
    });
  }

  return chips;
}

export function readStoredFilters(): SpotFilters {
  try {
    const stored = sessionStorage.getItem(SPOT_FILTERS_STORAGE_KEY);
    if (!stored) return EMPTY_SPOT_FILTERS;
    const parsed = JSON.parse(stored) as Partial<SpotFilters>;
    return {
      weather: Array.isArray(parsed.weather)
        ? parsed.weather.filter((v) => typeof v === "string")
        : [],
      status: SPOT_STATUS_OPTIONS.some((option) => option.value === parsed.status)
        ? (parsed.status as SpotStatus)
        : null,
      gear: Array.isArray(parsed.gear)
        ? parsed.gear.filter((v): v is SpotGear => SPOT_GEAR_OPTIONS.some((o) => o.value === v))
        : [],
      posted:
        typeof parsed.posted === "boolean" || parsed.posted === null
          ? parsed.posted
          : EMPTY_SPOT_FILTERS.posted,
    };
  } catch {
    return EMPTY_SPOT_FILTERS;
  }
}

export function storeFilters(filters: SpotFilters) {
  try {
    if (countActiveFilters(filters) === 0) sessionStorage.removeItem(SPOT_FILTERS_STORAGE_KEY);
    else sessionStorage.setItem(SPOT_FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Storage can be unavailable (private mode); filters then last for this visit only.
  }
}
