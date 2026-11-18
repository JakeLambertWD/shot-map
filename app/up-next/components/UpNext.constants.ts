import { SPOT_TAG_EMOJIS } from "@/app/components/add-spot/AddSpot.constants";
import { getSpotGearOption, type SpotGear } from "@/lib/photo-spots";

// The spot's gear and the weather it suits, as emoji, like "📷 🌅 🌧️".
export function formatSpotConditions(spot: { gear: SpotGear; tags: string[] }) {
  const weather = spot.tags.flatMap((tag) => SPOT_TAG_EMOJIS[tag] ?? []);
  return [getSpotGearOption(spot.gear).emoji, ...weather].join(" ");
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
