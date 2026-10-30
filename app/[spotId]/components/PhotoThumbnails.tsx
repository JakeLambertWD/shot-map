"use client";

import type { SpotDetail } from "@/server/routers/spots";
import { Box, Image, SimpleGrid, UnstyledButton, useMantineTheme } from "@mantine/core";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

type Photo = SpotDetail["photos"][number];

type PhotoThumbnailsProps = {
  photos: Photo[];
  activeIndex: number;
  onSelect: (index: number) => void;
  // Given, the thumbnails can be dragged into a new order (or moved with Alt + arrow keys).
  onReorder?: (photoIds: string[], movedPhotoId: string) => void;
  // Shown after the thumbnails, e.g. an "add photos" button.
  extraThumbnail?: ReactNode;
};

type Point = { x: number; y: number };

// A mouse drag starts once the pointer has moved this far; a finger has to hold still first.
const MOUSE_DRAG_DISTANCE = 6;
const TOUCH_HOLD_MS = 300;
const TOUCH_SLOP = 8;

type Drag = {
  photoId: string;
  fromIndex: number;
  overIndex: number;
  // Centre of each grid cell when the drag started, used to find the cell under the pointer.
  slotCentres: Point[];
};

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function PhotoThumbnails({
  photos,
  activeIndex,
  onSelect,
  onReorder,
  extraThumbnail,
}: PhotoThumbnailsProps) {
  const theme = useMantineTheme();
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const isDraggingRef = useRef(false);
  // A drag ends with a click on the thumbnail; this swallows it so the carousel doesn't jump.
  const suppressClickRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const canReorder = Boolean(onReorder) && photos.length > 1;

  // While dragging with a finger, stop the page from scrolling under it.
  useEffect(() => {
    function preventScroll(event: TouchEvent) {
      if (isDraggingRef.current) event.preventDefault();
    }
    window.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      window.removeEventListener("touchmove", preventScroll);
      cleanupRef.current?.();
    };
  }, []);

  function nearestSlot(point: Point, slotCentres: Point[]) {
    const distance = (slot: Point) => Math.hypot(slot.x - point.x, slot.y - point.y);
    let nearest = 0;
    for (let index = 1; index < slotCentres.length; index++) {
      if (distance(slotCentres[index]) < distance(slotCentres[nearest])) nearest = index;
    }
    return nearest;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    if (!canReorder || (event.pointerType === "mouse" && event.button !== 0)) return;
    cleanupRef.current?.();

    const startX = event.clientX;
    const startY = event.clientY;
    const isMouse = event.pointerType === "mouse";
    const photoId = photos[index].id;
    let current: Drag | null = null;

    function begin() {
      const slotCentres = thumbRefs.current.slice(0, photos.length).map((thumb) => {
        const rect = thumb?.getBoundingClientRect();
        return rect
          ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
          : { x: 0, y: 0 };
      });
      current = { photoId, fromIndex: index, overIndex: index, slotCentres };
      isDraggingRef.current = true;
      setDrag(current);
      if (!isMouse) navigator.vibrate?.(10);
    }

    const holdTimer = isMouse ? null : window.setTimeout(begin, TOUCH_HOLD_MS);

    function handleMove(moveEvent: PointerEvent) {
      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!current) {
        if (isMouse && distance > MOUSE_DRAG_DISTANCE) begin();
        // A finger that moves before the hold finishes is scrolling, not dragging.
        else if (!isMouse && distance > TOUCH_SLOP) finish(false);
        if (!current) return;
      }
      const overIndex = nearestSlot(
        { x: moveEvent.clientX, y: moveEvent.clientY },
        current.slotCentres,
      );
      if (overIndex !== current.overIndex) {
        current = { ...current, overIndex };
        setDrag(current);
      }
    }

    function finish(shouldSave: boolean) {
      if (holdTimer) window.clearTimeout(holdTimer);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
      cleanupRef.current = null;

      if (current) {
        suppressClickRef.current = true;
        // The click (if any) fires straight after pointerup.
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        if (shouldSave && current.overIndex !== current.fromIndex) {
          const ids = moveItem(
            photos.map((photo) => photo.id),
            current.fromIndex,
            current.overIndex,
          );
          onReorder?.(ids, current.photoId);
        }
      }
      current = null;
      isDraggingRef.current = false;
      setDrag(null);
    }

    function handleUp() {
      finish(true);
    }
    function handleCancel() {
      finish(false);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
    cleanupRef.current = () => finish(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!canReorder || !event.altKey) return;
    // Left and right move one place; up and down move a whole row of the 3-column grid.
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -3,
      ArrowDown: 3,
    };
    const step = steps[event.key] ?? 0;
    const target = index + step;
    if (step === 0 || target < 0 || target >= photos.length) return;
    event.preventDefault();
    const ids = moveItem(
      photos.map((photo) => photo.id),
      index,
      target,
    );
    onReorder?.(ids, photos[index].id);
    // Keep focus on the moved thumbnail once it re-renders in its new place.
    window.requestAnimationFrame(() => thumbRefs.current[target]?.focus());
  }

  // While dragging, show the order the photos would have if dropped now.
  const shownPhotos = drag ? moveItem(photos, drag.fromIndex, drag.overIndex) : photos;

  return (
    <SimpleGrid cols={3} spacing={8}>
      {shownPhotos.map((photo, index) => {
        const originalIndex = photos.indexOf(photo);
        const isActive = !drag && originalIndex === activeIndex;
        const isDragged = drag?.photoId === photo.id;

        return (
          <UnstyledButton
            key={photo.id}
            ref={(element) => {
              thumbRefs.current[index] = element;
            }}
            aria-label={`Show photo ${index + 1}`}
            aria-current={isActive ? "true" : undefined}
            aria-description={
              canReorder ? "Hold and drag, or press Alt and an arrow key, to reorder" : undefined
            }
            onClick={() => {
              if (!suppressClickRef.current) onSelect(originalIndex);
            }}
            onPointerDown={(event) => handlePointerDown(event, originalIndex)}
            onKeyDown={(event) => handleKeyDown(event, originalIndex)}
            onContextMenu={(event) => {
              if (canReorder) event.preventDefault();
            }}
            pos="relative"
            bdrs="sm"
            style={{
              aspectRatio: "1",
              overflow: "hidden",
              outline: isActive || isDragged ? `2px solid ${theme.colors.yellow[5]}` : "none",
              outlineOffset: 2,
              transform: isDragged ? "scale(1.06)" : undefined,
              boxShadow: isDragged ? "0 10px 24px rgba(0, 0, 0, 0.6)" : undefined,
              zIndex: isDragged ? 1 : undefined,
              cursor: drag ? "grabbing" : canReorder ? "grab" : undefined,
              transition: "transform 120ms ease, box-shadow 120ms ease",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
            <Image
              src={photo.imageUrl}
              alt=""
              w="100%"
              h="100%"
              fit="cover"
              draggable={false}
              style={{ pointerEvents: "none" }}
            />
            <Box
              aria-hidden
              component="span"
              pos="absolute"
              top={6}
              left={6}
              miw={20}
              h={20}
              px={5}
              fz={11}
              fw={900}
              c="brown.0"
              style={{
                borderRadius: 10,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              {index + 1}
            </Box>
          </UnstyledButton>
        );
      })}
      {extraThumbnail}
    </SimpleGrid>
  );
}
