import { Center, Group, UnstyledButton } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";
import type { KeyboardEvent, PointerEvent } from "react";

const SIZE = 22;
const INSET = 8;
// The drag handle reaches the card's corner so it's easy to grab; the number stays where it was.
const HANDLE_WIDTH = 52;
const HANDLE_HEIGHT = SIZE + INSET * 2;

// The right padding a card's text needs so the number (and its drag handle) doesn't cover it.
export const UPCOMING_POST_NUMBER_GUTTER = HANDLE_WIDTH + 4;
// The height the number takes up at the bottom of a card.
export const UPCOMING_POST_NUMBER_HEIGHT = HANDLE_HEIGHT;

// Given to a card that can be dragged into a new place in its list.
export type UpcomingPostDragHandle = {
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  // Alt + up or down arrow moves the post one place.
  onMove: (step: -1 | 1) => void;
};

type UpcomingPostNumberProps = {
  postId: string;
  number: number;
  dragHandle?: UpcomingPostDragHandle;
};

// A post's place in its tab's list, pinned to the bottom right of its card so it sits on the same
// line as the card's last row of text. The card must be positioned, and keep that text
// UPCOMING_POST_NUMBER_GUTTER clear of its right edge. With a drag handle it's also the grip for
// dragging the post into a new place.
export function UpcomingPostNumber({ postId, number, dragHandle }: UpcomingPostNumberProps) {
  const label = (
    <Center w={SIZE} h={SIZE} c="yellow.5" fz={11} fw={900}>
      {number}
    </Center>
  );

  if (!dragHandle) {
    return (
      <Center pos="absolute" bottom={INSET} right={INSET} aria-hidden>
        {label}
      </Center>
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const step = { ArrowUp: -1, ArrowDown: 1 }[event.key] as -1 | 1 | undefined;
    if (!event.altKey || !step) return;
    event.preventDefault();
    dragHandle?.onMove(step);
  }

  return (
    <UnstyledButton
      data-drag-handle={postId}
      aria-label={`Post ${number}. Drag, or press Alt and an arrow key, to move it`}
      onPointerDown={dragHandle.onPointerDown}
      onKeyDown={handleKeyDown}
      pos="absolute"
      bottom={0}
      right={0}
      w={HANDLE_WIDTH}
      h={HANDLE_HEIGHT}
      pr={INSET}
      // Stop the page scrolling, or a long press opening a menu, when a finger grabs the handle.
      style={{ cursor: "grab", touchAction: "none", WebkitTouchCallout: "none" }}
    >
      <Group gap={0} justify="flex-end" wrap="nowrap" aria-hidden>
        <IconGripVertical size={14} color="var(--mantine-color-brown-2)" />
        {label}
      </Group>
    </UnstyledButton>
  );
}
