"use client";

import type { PlaceResult } from "@/server/routers/places";
import { useMantineTheme } from "@mantine/core";
import { IconMapPinFilled } from "@tabler/icons-react";

type SearchedPlaceMarkerProps = {
  place: PlaceResult;
};

// Shows where a searched place is. Add spot (bottom right) saves it, pre-filled with its name.
export function SearchedPlaceMarker({ place }: SearchedPlaceMarkerProps) {
  const theme = useMantineTheme();

  return (
    <IconMapPinFilled
      size={36}
      color={theme.colors.brown[0]}
      aria-label={`Search result: ${place.name}`}
      style={{ filter: "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5))" }}
    />
  );
}
