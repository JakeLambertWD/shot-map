"use client";

import { REEL_TYPE_STYLES } from "@/app/[spotId]/components/reels/Reels.constants";
import { getSpotTabHref } from "@/app/[spotId]/components/SpotContentTabs.constants";
import type { ReelSpot } from "@/server/routers/reels";
import { Box, Center, Group, Image, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconChevronRight, IconGripVertical, IconMapPin, IconPhoto } from "@tabler/icons-react";
import { Reorder, useDragControls } from "motion/react";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import {
  formatReelCount,
  formatSpotLocation,
  moveItem,
  sortKindCounts,
  type ReelKindCount,
} from "./ReelSpots.constants";

const ROW_DIVIDER = "1px solid var(--mantine-color-brown-4)";

type ReelSpotListProps = {
  spots: ReelSpot[];
  canReorder: boolean;
  // Called once a spot is dropped somewhere new, with every spot's id in the new order.
  onReorder: (spotIds: string[]) => void;
};

// The Reels page's spots. When they can be reordered, each row's grip is a handle for dragging
// it into a new place; the others slide out of the way.
export function ReelSpotList({ spots, canReorder, onReorder }: ReelSpotListProps) {
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
      {ids.map((id) => (
        <ReelSpotRow
          key={id}
          spot={spotsById.get(id)!}
          canReorder={canReorder && spots.length > 1}
          onDragEnd={handleDragEnd}
          onMove={(step) => move(id, step)}
        />
      ))}
    </Reorder.Group>
  );
}

type ReelSpotRowProps = {
  spot: ReelSpot;
  canReorder: boolean;
  onDragEnd: () => void;
  // Alt + up or down arrow moves the spot one place.
  onMove: (step: -1 | 1) => void;
};

function ReelSpotRow({ spot, canReorder, onDragEnd, onMove }: ReelSpotRowProps) {
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
      value={spot.id}
      // Only the grip starts a drag, so tapping the row still opens the spot.
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 28px rgba(0, 0, 0, 0.55)" }}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        borderBottom: ROW_DIVIDER,
        // Covers the rows underneath while it's dragged over them.
        backgroundColor: "var(--background)",
      }}
    >
      <UnstyledButton
        component={Link}
        href={getSpotTabHref(spot.id, "reels", "reels")}
        py="sm"
        flex={1}
        miw={0}
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        <Box w={56} h={56} bdrs="sm" bg="brown.4" style={{ flexShrink: 0, overflow: "hidden" }}>
          {spot.coverImageUrl ? (
            <Image src={spot.coverImageUrl} alt="" w={56} h={56} fit="cover" />
          ) : (
            <Center h="100%">
              <IconPhoto size={22} color="var(--mantine-color-brown-2)" />
            </Center>
          )}
        </Box>

        <Stack gap={6} flex={1} miw={0}>
          <Group justify="space-between" align="baseline" wrap="nowrap" gap="sm">
            <Text fw={700} c="brown.0" truncate>
              {spot.title}
            </Text>
            <Text fz="xs" c="brown.1" style={{ flexShrink: 0 }}>
              {formatReelCount(spot.reelCount)}
            </Text>
          </Group>
          <Group gap={4} wrap="nowrap" c="brown.1">
            <IconMapPin size={14} aria-hidden style={{ flexShrink: 0 }} />
            <Text fz="xs" truncate>
              {formatSpotLocation(spot)}
            </Text>
          </Group>
          <Group gap={4}>
            {sortKindCounts(spot.kinds).map((kindCount) => (
              <ReelKindPill key={kindCount.kind} {...kindCount} />
            ))}
          </Group>
        </Stack>

        {!canReorder && (
          <IconChevronRight
            size={18}
            color="var(--mantine-color-brown-2)"
            aria-hidden
            style={{ flexShrink: 0 }}
          />
        )}
      </UnstyledButton>

      {canReorder && (
        <UnstyledButton
          data-drag-handle={spot.id}
          aria-label={`Move ${spot.title}. Drag, or press Alt and an arrow key`}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            dragControls.start(event);
          }}
          onKeyDown={handleKeyDown}
          w={44}
          h={56}
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
          <IconGripVertical size={18} color="var(--mantine-color-brown-2)" aria-hidden />
        </UnstyledButton>
      )}
    </Reorder.Item>
  );
}

// A reel type and how many of it a spot has, like "Educational ×2", in that type's colours.
function ReelKindPill({ kind, count }: ReelKindCount) {
  const style = REEL_TYPE_STYLES[kind];

  return (
    <Text
      component="span"
      fz={11}
      fw={900}
      lh={1}
      px={8}
      py={4}
      bg={style.tint}
      c={style.text}
      style={{ borderRadius: 10, border: `1px solid ${style.color}` }}
    >
      {count > 1 ? `${style.label} ×${count}` : style.label}
    </Text>
  );
}
