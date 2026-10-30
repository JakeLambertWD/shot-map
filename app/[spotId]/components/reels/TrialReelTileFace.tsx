"use client";

import type { TrialReel } from "@/server/routers/trialReels";
import { Box, Center, Text } from "@mantine/core";
import { IconBrandInstagram } from "@tabler/icons-react";

// Instagram doesn't share reel covers, so each tile gets one of these, picked from its id so
// it's the same on every spot.
const TILE_COLORS = ["#5b3a3a", "#3d3330", "#4a3f35", "#2f3238", "#6b4a2a", "#2e3a44", "#43382f"];

function tileColor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return TILE_COLORS[Math.abs(hash) % TILE_COLORS.length];
}

// What a trial reel link shows on a tile: its own name, or "Instagram reel" without one.
export function getTrialReelLabel(reel: TrialReel) {
  return reel.creator ?? "Instagram reel";
}

// The look of a trial reel tile: a 9:16 colour block with an Instagram mark and the creator's @.
// Fills its parent, which is the tappable part.
export function TrialReelTileFace({ reel }: { reel: TrialReel }) {
  return (
    <Box pos="absolute" inset={0} style={{ backgroundColor: tileColor(reel.id) }}>
      <Center
        aria-hidden
        pos="absolute"
        top="50%"
        left="50%"
        style={{ transform: "translate(-50%, -50%)", opacity: 0.85 }}
      >
        <IconBrandInstagram size={30} stroke={1.6} color="var(--mantine-color-brown-0)" />
      </Center>
      <Text
        component="span"
        aria-hidden
        pos="absolute"
        left={0}
        right={0}
        bottom={0}
        px={6}
        pt={18}
        pb={6}
        fz={11}
        fw={700}
        c="brown.0"
        truncate
        style={{ background: "linear-gradient(transparent, rgba(0, 0, 0, 0.75))" }}
      >
        {getTrialReelLabel(reel)}
      </Text>
    </Box>
  );
}
