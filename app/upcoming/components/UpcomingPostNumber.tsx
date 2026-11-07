import { Center } from "@mantine/core";

const SIZE = 22;
const INSET = 8;

// The right padding a card's text needs so the number doesn't cover it.
export const UPCOMING_POST_NUMBER_GUTTER = SIZE + INSET * 2;

// A post's place in its tab's list, pinned to the bottom right of its card so it sits on the same
// line as the card's last row of text. The card must be positioned, and keep that text
// UPCOMING_POST_NUMBER_GUTTER clear of its right edge.
export function UpcomingPostNumber({ number }: { number: number }) {
  return (
    <Center
      pos="absolute"
      bottom={INSET}
      right={INSET}
      w={SIZE}
      h={SIZE}
      c="yellow.5"
      fz={11}
      fw={900}
      aria-hidden
    >
      {number}
    </Center>
  );
}
