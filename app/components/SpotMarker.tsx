"use client";

import type { SpotSummary } from "@/server/routers/spots";
import { Center, Image, UnstyledButton, useMantineTheme } from "@mantine/core";
import { IconPhoto } from "@tabler/icons-react";

type SpotMarkerProps = {
  spot: SpotSummary;
  onSelect: (spot: SpotSummary) => void;
};

export function SpotMarker({ spot, onSelect }: SpotMarkerProps) {
  const theme = useMantineTheme();
  const ringColor = theme.colors.amber[5];

  return (
    <UnstyledButton
      aria-label={`${spot.title}, ${spot.photoCount} ${spot.photoCount === 1 ? "photo" : "photos"}`}
      onClick={() => onSelect(spot)}
      w={46}
      h={46}
      bdrs="50%"
      bg="teal.7"
      style={{
        border: `3px solid ${ringColor}`,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.45)",
      }}
    >
      {spot.coverImageUrl ? (
        <Image src={spot.coverImageUrl} alt="" w="100%" h="100%" fit="cover" bdrs="50%" />
      ) : (
        <Center h="100%">
          <IconPhoto size={18} color={theme.colors.teal[1]} />
        </Center>
      )}
    </UnstyledButton>
  );
}
