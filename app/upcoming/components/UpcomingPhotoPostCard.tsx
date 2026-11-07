"use client";

import { REEL_CARD_BORDER } from "@/app/[spotId]/components/reels/Reels.constants";
import type { UpcomingPost } from "@/server/routers/upcomingPosts";
import { Center, Group, Paper, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconPhoto } from "@tabler/icons-react";
import { useState } from "react";
import { UpcomingMediaThumbnail } from "./UpcomingMediaThumbnail";
import { UpcomingMediaViewer } from "./UpcomingMediaViewer";
import { UPCOMING_POST_NUMBER_GUTTER, UpcomingPostNumber } from "./UpcomingPostNumber";
import { formatPhotoPostSummary } from "./UpcomingPosts.constants";

// A carousel or single-photo post: its photos in a row, then the title and what's in it.
// Tapping a photo opens it full screen; tapping the rest opens the post's details to edit.
export function UpcomingPhotoPostCard({
  post,
  number,
  onOpen,
}: {
  post: UpcomingPost;
  // Its place in the Carousels tab.
  number: number;
  onOpen: () => void;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  return (
    <Paper pos="relative" bg="brown.6" radius="md" p="sm" style={{ border: REEL_CARD_BORDER }}>
      <Stack gap="sm">
        <Group gap={6} wrap="nowrap" style={{ overflowX: "auto", scrollbarWidth: "none" }}>
          {post.media.length === 0 ? (
            <Center
              w={100}
              h={125}
              bg="brown.5"
              aria-hidden
              style={{ borderRadius: 6, flex: "none" }}
            >
              <IconPhoto size={24} color="var(--mantine-color-brown-2)" />
            </Center>
          ) : (
            post.media.map((media, index) => (
              <UpcomingMediaThumbnail
                key={media.id}
                media={media}
                index={index}
                w={100}
                h={125}
                onClick={() => setViewerIndex(index)}
              />
            ))
          )}
        </Group>
        <UnstyledButton
          onClick={onOpen}
          w="100%"
          // The gutter less the card's own padding.
          pr={`calc(${UPCOMING_POST_NUMBER_GUTTER}px - var(--mantine-spacing-sm))`}
          aria-label={`${number}. ${post.title}, ${formatPhotoPostSummary(post)}. Edit`}
        >
          <Stack gap={4} miw={0}>
            <Text ff="heading" fz={15} fw={600} lh={1.3} c="brown.0">
              {post.title}
            </Text>
            <Text fz="xs" c="brown.1">
              {formatPhotoPostSummary(post)}
            </Text>
            {post.caption && (
              <Text fz="sm" lh={1.35} c="brown.0" lineClamp={2} style={{ whiteSpace: "pre-line" }}>
                {post.caption}
              </Text>
            )}
          </Stack>
        </UnstyledButton>
      </Stack>
      <UpcomingPostNumber number={number} />

      <UpcomingMediaViewer
        media={post.media}
        startIndex={viewerIndex}
        title={post.title}
        onClose={() => setViewerIndex(null)}
      />
    </Paper>
  );
}
