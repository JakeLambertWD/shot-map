import { api } from "@/app/providers";
import { useMemo } from "react";
import { formatSpotTag, SUGGESTED_SPOT_TAGS } from "./AddSpot.constants";

// Weather options ordered by how many spots use them; ties keep the default order.
// Tags already on the spot being edited stay selectable even if they aren't suggestions.
export function useSortedSpotTags(currentTags: string[] = []) {
  const spots = api.spots.list.useQuery().data;
  const currentKey = currentTags.join("\n");

  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const spot of spots ?? []) {
      for (const tag of spot.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }

    const extras = currentKey
      ? currentKey
          .split("\n")
          .filter((tag) => !SUGGESTED_SPOT_TAGS.some((option) => option === tag))
      : [];
    const options: string[] = [...SUGGESTED_SPOT_TAGS];

    return [...options]
      .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
      .concat(extras)
      .map((tag) => ({ value: tag, label: formatSpotTag(tag) }));
  }, [spots, currentKey]);
}
