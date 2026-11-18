"use client";

import { UnstyledButton } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";
import { Reorder, useDragControls } from "motion/react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { moveItem, SPOT_ROW_DIVIDER, SPOT_THUMBNAIL_SIZE } from "./SortableSpots.constants";

type SortableSpot = { id: string; title: string };

type SortableSpotListProps<Spot extends SortableSpot> = {
  spots: Spot[];
  canReorder: boolean;
  // Called once a spot is dropped somewhere new, with every spot's id in the new order.
  onReorder: (spotIds: string[]) => void;
  // The row's content, shown before its drag handle.
  renderSpot: (spot: Spot) => ReactNode;
};

// A list of spots, one per row. When they can be reordered, each row's grip is a handle for
// dragging it into a new place; the others slide out of the way.
export function SortableSpotList<Spot extends SortableSpot>({
  spots,
  canReorder,
  onReorder,
  renderSpot,
}: SortableSpotListProps<Spot>) {
  // The order shown while a spot is being dragged; null the rest of the time.
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const dragOrderRef = useRef<string[] | null>(null);

  const spotsById = new Map(spots.map((spot) => [spot.id, spot]));
  const ids = (dragOrder ?? spots.map((spot) => spot.id)).filter((id) => spotsById.has(id));

  function updateDragOrder(order: string[]) {
    dragOrderRef.current = order;
    setDragOrder(order);
  }

  function save(order: string[]) {
    if (order.some((id, index) => id !== spots[index]?.id)) onReorder(order);
  }

  function handleDragEnd() {
    if (dragOrderRef.current) save(dragOrderRef.current);
    dragOrderRef.current = null;
    setDragOrder(null);
  }

  function move(spotId: string, step: -1 | 1) {
    const from = spots.findIndex((spot) => spot.id === spotId);
    const to = from + step;
    if (from < 0 || to < 0 || to >= spots.length) return;
    save(
      moveItem(
        spots.map((spot) => spot.id),
        from,
        to,
      ),
    );
    // Keep focus on the handle once the row re-renders in its new place.
    window.requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-drag-handle="${spotId}"]`)?.focus(),
    );
  }

  return (
    <Reorder.Group
      as="ul"
      axis="y"
      values={ids}
      onReorder={updateDragOrder}
      style={{ listStyle: "none", margin: 0, padding: "0 var(--mantine-spacing-md)" }}
    >
      {ids.map((id) => {
        const spot = spotsById.get(id)!;
        return (
          <SortableSpotRow
            key={id}
            spotId={id}
            title={spot.title}
            canReorder={canReorder && spots.length > 1}
            onDragEnd={handleDragEnd}
            onMove={(step) => move(id, step)}
          >
            {renderSpot(spot)}
          </SortableSpotRow>
        );
      })}
    </Reorder.Group>
  );
}

type SortableSpotRowProps = {
  spotId: string;
  title: string;
  canReorder: boolean;
  onDragEnd: () => void;
  // Alt + up or down arrow moves the spot one place.
  onMove: (step: -1 | 1) => void;
  children: ReactNode;
};

function SortableSpotRow({
  spotId,
  title,
  canReorder,
  onDragEnd,
  onMove,
  children,
}: SortableSpotRowProps) {
  const dragControls = useDragControls();

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const step = { ArrowUp: -1, ArrowDown: 1 }[event.key] as -1 | 1 | undefined;
    if (!event.altKey || !step) return;
    event.preventDefault();
    onMove(step);
  }

  return (
    <Reorder.Item
      as="li"
      value={spotId}
      // Only the grip starts a drag, so tapping the row still opens the spot.
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 28px rgba(0, 0, 0, 0.55)" }}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        borderBottom: SPOT_ROW_DIVIDER,
        // Covers the rows underneath while it's dragged over them.
        backgroundColor: "var(--background)",
      }}
    >
      {children}

      {canReorder && (
        <UnstyledButton
          data-drag-handle={spotId}
          aria-label={`Move ${title}. Drag, or press Alt and an arrow key`}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            dragControls.start(event);
          }}
          onKeyDown={handleKeyDown}
          w={44}
          h={SPOT_THUMBNAIL_SIZE}
          ml={4}
          // Stop the page scrolling, or a long press opening a menu, when a finger grabs it.
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            cursor: "grab",
            touchAction: "none",
            WebkitTouchCallout: "none",
          }}
        >
          <IconGripVertical size={18} color="var(--mantine-color-teal-2)" aria-hidden />
        </UnstyledButton>
      )}
    </Reorder.Item>
  );
}
