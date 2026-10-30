"use client";

import { Box, Center, useMantineTheme } from "@mantine/core";

const RETICLE_SIZE = 32;
const RING_RADIUS = 6;
const TICK_GAP = 2;

// A minimal crosshair fixed to the middle of the map.
// The map moves underneath it, and the centre dot marks exactly where the spot goes.
export function PlacementCrosshair() {
  const theme = useMantineTheme();
  const accent = theme.colors.yellow[5];
  const outline = "rgba(0, 0, 0, 0.6)";

  const centre = RETICLE_SIZE / 2;
  const tickStart = RING_RADIUS + TICK_GAP;
  const tickEnd = centre - 2;

  const ticks = [
    { x1: centre - tickStart, y1: centre, x2: centre - tickEnd, y2: centre },
    { x1: centre + tickStart, y1: centre, x2: centre + tickEnd, y2: centre },
    { x1: centre, y1: centre - tickStart, x2: centre, y2: centre - tickEnd },
    { x1: centre, y1: centre + tickStart, x2: centre, y2: centre + tickEnd },
  ];

  return (
    <Box pos="absolute" inset={0} style={{ pointerEvents: "none" }} aria-hidden>
      <Center pos="absolute" inset={0}>
        <svg
          width={RETICLE_SIZE}
          height={RETICLE_SIZE}
          viewBox={`0 0 ${RETICLE_SIZE} ${RETICLE_SIZE}`}
        >
          {/* Dark outline underneath keeps the reticle visible on light map areas. */}
          {ticks.map((tick, index) => (
            <line
              key={`outline-${index}`}
              {...tick}
              stroke={outline}
              strokeWidth={4}
              strokeLinecap="round"
            />
          ))}

          {ticks.map((tick, index) => (
            <line
              key={`tick-${index}`}
              {...tick}
              stroke={accent}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
          <circle cx={centre} cy={centre} r={3} fill={accent} stroke={outline} strokeWidth={1.5} />
        </svg>
      </Center>
    </Box>
  );
}
