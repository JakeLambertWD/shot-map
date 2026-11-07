"use client";

import type { UpcomingPost } from "@/server/routers/upcomingPosts";
import { Reorder, useDragControls } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import type { UpcomingPostDragHandle } from "./UpcomingPostNumber";

type UpcomingPostListProps = {
  posts: UpcomingPost[];
  canReorder: boolean;
  // Called once a post is dropped somewhere new, with every post's id in the new order.
  onReorder: (postIds: string[]) => void;
  renderPost: (
    post: UpcomingPost,
    number: number,
    dragHandle: UpcomingPostDragHandle | undefined,
  ) => ReactNode;
};

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// One tab's posts. When they can be reordered, each card's number is a handle for dragging it
// into a new place; the others slide out of the way and the page scrolls near the edges.
export function UpcomingPostList({
  posts,
  canReorder,
  onReorder,
  renderPost,
}: UpcomingPostListProps) {
  // The order shown while a post is being dragged; null the rest of the time.
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const dragOrderRef = useRef<string[] | null>(null);

  const postsById = new Map(posts.map((post) => [post.id, post]));
  const ids = (dragOrder ?? posts.map((post) => post.id)).filter((id) => postsById.has(id));

  function updateDragOrder(order: string[]) {
    dragOrderRef.current = order;
    setDragOrder(order);
  }

  function save(order: string[]) {
    if (order.some((id, index) => id !== posts[index]?.id)) onReorder(order);
  }

  function handleDragEnd() {
    if (dragOrderRef.current) save(dragOrderRef.current);
    dragOrderRef.current = null;
    setDragOrder(null);
  }

  function move(postId: string, step: -1 | 1) {
    const from = posts.findIndex((post) => post.id === postId);
    const to = from + step;
    if (from < 0 || to < 0 || to >= posts.length) return;
    save(
      moveItem(
        posts.map((post) => post.id),
        from,
        to,
      ),
    );
    // Keep focus on the handle once the post re-renders in its new place.
    window.requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-drag-handle="${postId}"]`)?.focus(),
    );
  }

  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={ids}
      onReorder={updateDragOrder}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {ids.map((id, index) => (
        <SortablePost
          key={id}
          id={id}
          canReorder={canReorder && posts.length > 1}
          onDragEnd={handleDragEnd}
          onMove={(step) => move(id, step)}
        >
          {(dragHandle) => renderPost(postsById.get(id)!, index + 1, dragHandle)}
        </SortablePost>
      ))}
    </Reorder.Group>
  );
}

function SortablePost({
  id,
  canReorder,
  onDragEnd,
  onMove,
  children,
}: {
  id: string;
  canReorder: boolean;
  onDragEnd: () => void;
  onMove: (step: -1 | 1) => void;
  children: (dragHandle: UpcomingPostDragHandle | undefined) => ReactNode;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={id}
      // Only the handle starts a drag, so the card's own taps and sideways scrolling still work.
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 28px rgba(0, 0, 0, 0.55)" }}
      style={{ position: "relative", borderRadius: "var(--mantine-radius-md)" }}
    >
      {children(
        canReorder
          ? {
              onPointerDown: (event) => {
                if (event.pointerType === "mouse" && event.button !== 0) return;
                dragControls.start(event);
              },
              onMove,
            }
          : undefined,
      )}
    </Reorder.Item>
  );
}
