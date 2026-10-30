"use client";

import type { SpotSummary } from "@/server/routers/spots";
import { Center, Image, UnstyledButton, useMantineTheme } from "@mantine/core";
import { IconCheck, IconPhoto } from "@tabler/icons-react";

type SpotMarkerProps = {
  spot: SpotSummary;
  onSelect: (spot: SpotSummary) => void;
  // Its stop number when the spot is on today's shoot; shown as a badge (a tick once shot).
  shootNumber?: number;
  isShot?: boolean;
};

export function SpotMarker({ spot, onSelect, shootNumber, isShot }: SpotMarkerProps) {
  const theme = useMantineTheme();
  const ringColor = theme.colors.yellow[5];

  return (
    <UnstyledButton
      aria-label={`${spot.title}, ${spot.photoCount} ${spot.photoCount === 1 ? "photo" : "photos"}${
        shootNumber ? `, stop ${shootNumber} on today's shoot` : ""
      }`}
      onClick={() => onSelect(spot)}
      pos="relative"
      w={46}
      h={46}
      bdrs="50%"
      bg="brown.7"
      style={{
        border: `3px solid ${ringColor}`,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.45)",
      }}
    >
      {spot.coverImageUrl ? (
        <Image src={spot.coverImageUrl} alt="" w="100%" h="100%" fit="cover" bdrs="50%" />
      ) : (
        <Center h="100%">
          <IconPhoto size={18} color={theme.colors.brown[1]} />
        </Center>
      )}
      {shootNumber && (
        <Center
          aria-hidden
          pos="absolute"
          top={-8}
          right={-8}
          w={20}
          h={20}
          bg="yellow.5"
          c="brown.9"
          fz={11}
          fw={900}
          style={{ borderRadius: "50%", boxShadow: "0 2px 6px rgba(0, 0, 0, 0.5)" }}
        >
          {isShot ? <IconCheck size={12} stroke={3.5} /> : shootNumber}
        </Center>
      )}
    </UnstyledButton>
  );
}
