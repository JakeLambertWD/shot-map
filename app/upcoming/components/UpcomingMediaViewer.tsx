"use client";

import type { UpcomingPostMedia } from "@/server/routers/upcomingPosts";
import { ActionIcon, Image, Modal, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useCallback, useState, type UIEvent } from "react";
import styles from "./UpcomingMediaViewer.module.css";

type UpcomingMediaViewerProps = {
  media: UpcomingPostMedia[];
  // The item to open on; null keeps the viewer closed.
  startIndex: number | null;
  title: string;
  onClose: () => void;
};

// A post's photos and videos full screen, swiping between them like the spot page's viewer.
export function UpcomingMediaViewer({
  media,
  startIndex,
  title,
  onClose,
}: UpcomingMediaViewerProps) {
  return (
    <Modal
      opened={startIndex !== null}
      onClose={onClose}
      fullScreen
      padding={0}
      withCloseButton={false}
      transitionProps={{ transition: "fade", duration: 150 }}
      styles={{ content: { background: "black" }, body: { height: "100%" } }}
    >
      {startIndex !== null && (
        <ViewerTrack media={media} startIndex={startIndex} title={title} onClose={onClose} />
      )}
    </Modal>
  );
}

function ViewerTrack({
  media,
  startIndex,
  title,
  onClose,
}: UpcomingMediaViewerProps & { startIndex: number }) {
  const [activeIndex, setActiveIndex] = useState(startIndex);

  // Start on the item that was tapped, without animating.
  const placeTrack = useCallback(
    (track: HTMLDivElement | null) => {
      if (track) track.scrollLeft = startIndex * track.clientWidth;
    },
    [startIndex],
  );

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index === activeIndex) return;
    // Stop a video that's been swiped away from.
    track.querySelectorAll("video").forEach((video) => video.pause());
    setActiveIndex(index);
  }

  return (
    <>
      {media.length > 1 && (
        <Text
          aria-hidden
          pos="absolute"
          top="var(--mantine-spacing-md)"
          left="var(--mantine-spacing-md)"
          fz={13}
          fw={700}
          c="white"
          style={{ zIndex: 1 }}
        >
          {activeIndex + 1} / {media.length}
        </Text>
      )}
      <ActionIcon
        variant="transparent"
        c="white"
        size={44}
        pos="absolute"
        top="var(--mantine-spacing-sm)"
        right="var(--mantine-spacing-sm)"
        style={{ zIndex: 1 }}
        aria-label="Close full screen"
        onClick={onClose}
      >
        <IconX size={28} />
      </ActionIcon>
      <div
        ref={placeTrack}
        className={styles.track}
        onScroll={handleScroll}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} full screen`}
      >
        {media.map((item, index) =>
          item.mediaType === "video" ? (
            <video
              key={item.id}
              className={styles.slide}
              src={item.mediaUrl}
              poster={item.posterUrl ?? undefined}
              aria-label={`Video ${index + 1}`}
              preload="none"
              controls
              playsInline
            />
          ) : (
            <Image
              key={item.id}
              className={styles.slide}
              src={item.mediaUrl}
              alt={`Photo ${index + 1}`}
              loading="lazy"
              fit="contain"
            />
          ),
        )}
      </div>
    </>
  );
}
