"use client";

import { Group, useMantineTheme } from "@mantine/core";

// At most this many dots show; with more photos the row slides along with the active one.
const MAX_DOTS = 7;

// Instagram-style page dots. Dots at an edge of the row shrink when there are more photos beyond it.
export function PhotoDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  const theme = useMantineTheme();
  if (count < 2) return null;

  const shown = Math.min(count, MAX_DOTS);
  const start = Math.min(Math.max(activeIndex - Math.floor(shown / 2), 0), count - shown);
  const end = start + shown - 1;

  function sizeOf(index: number) {
    const fromStart = index - start;
    const fromEnd = end - index;
    if (start > 0 && fromStart === 0) return 4;
    if (start > 0 && fromStart === 1) return 6;
    if (end < count - 1 && fromEnd === 0) return 4;
    if (end < count - 1 && fromEnd === 1) return 6;
    return 8;
  }

  return (
    <Group
      role="img"
      aria-label={`Photo ${activeIndex + 1} of ${count}`}
      gap={6}
      wrap="nowrap"
      h={44}
      justify="center"
      align="center"
    >
      {Array.from({ length: shown }, (_, offset) => {
        const index = start + offset;
        const size = sizeOf(index);
        const isActive = index === activeIndex;
        return (
          <span
            key={index}
            aria-hidden
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              flex: "none",
              backgroundColor: isActive
                ? theme.colors.yellow[5]
                : size < 8
                  ? theme.colors.brown[3]
                  : theme.colors.brown[2],
              transition: "width 150ms ease, height 150ms ease, background-color 150ms ease",
            }}
          />
        );
      })}
    </Group>
  );
}
