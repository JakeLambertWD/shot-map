import { useState } from "react";
import { readStoredFilters, storeFilters, type SpotFilters } from "./SpotFilters.constants";

// The map's applied filters, kept for the session so they survive opening a spot.
// The map only renders in the browser, so storage can be read straight away.
export function useSpotFilters() {
  const [filters, setFiltersState] = useState<SpotFilters>(readStoredFilters);

  function setFilters(next: SpotFilters) {
    setFiltersState(next);
    storeFilters(next);
  }

  return [filters, setFilters] as const;
}
